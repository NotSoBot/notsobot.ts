import { Command, Interaction, Structures } from 'detritus-client';
import {
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageComponentInputTextStyles,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';
import {
  ComponentContext,
  Components,
  InteractionModal,
  InteractionModalArgs,
  InteractionModalContext,
  Markup,
} from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import { deleteGuildTimedBans, deleteGuildWarning, fetchGuildWarnings, putGuildWarnings } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import GuildLoggingListener from '../../../listeners/guildlogging';
import {
  ApiErrorCodes,
  BAN_CLEAN_DEFAULT,
  DateMomentLogFormat,
  EmbedColors,
  GuildModerationDmFlags,
  MAX_GUILD_WARNING_REASON_LENGTH,
  MAX_GUILD_WARNING_USER_AMOUNT,
  MAX_GUILD_WARNING_USERS,
  PermissionsText,
  StatusEmojis,
} from '../../../constants';
import { TranslationKey, Translator, getCachedTranslator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import {
  DisplayBlock,
  DisplayPayload,
  Paginator,
  Parameters,
  chunkArray,
  createTimestampMomentFromGuild,
  displayDetailsLine,
  displayReply,
  formatDuration,
  formatUserTag,
  renderEphemeralDisplay,
} from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import * as ModerationBan from './moderation.ban';
import * as ModerationKick from './moderation.kick';
import * as ModerationMute from './moderation.mute';
import { formatMember } from './moderation.mute';
import * as ModerationPrune from './moderation.prune';
import { formatReasonLine, formatWarningDetails } from './moderation.warnings';


export const COMMAND_ID = 'moderation.warn';

// a member's earlier warnings under a warning, paged
export const PAST_WARNINGS_PER_PAGE = 4;
// how long the buttons (pages and actions) stay under a warning after the last press
export const ACTIONS_TIMEOUT = 5 * 60 * 1000;

export type WarnAction = 'ban' | 'kick' | 'mute';

// what the duration field starts as, a ban emptied out is permanent
const ACTION_DEFAULT_DURATIONS: Partial<Record<WarnAction, string>> = {ban: '7d', mute: '1h'};
// what the ban's delete messages field starts as (the server's `ban_clean`), in the biggest unit it fits so it reads like
// what someone would type, emptied out deletes none
export function formatCleanInput(seconds: number): string | undefined {
  if (!seconds) {
    return undefined;
  }
  for (let [ unit, size ] of [['d', 24 * 60 * 60], ['h', 60 * 60], ['m', 60]] as const) {
    if (seconds % size === 0) {
      return `${seconds / size}${unit}`;
    }
  }
  return `${seconds}s`;
}
// discord only deletes messages from up to a week back
const MAX_CLEAN = 7 * 24 * 60 * 60;

// the prune button, the same limit as the prune command
const PRUNE_DEFAULT_AMOUNT = 100;
const PRUNE_MAX_AMOUNT = 500;
// how far back the prune button goes, the two week bulk delete limit
const PRUNE_MAX_SINCE = 14 * 24 * 60 * 60;
// in the warning's channel, for both of us
const PRUNE_PERMISSIONS = [Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY, Permissions.MANAGE_MESSAGES];

// the permission both the moderator and the bot need for a button to show, plus what its modal asks
const ACTIONS: Record<WarnAction, {
  durationKey: TranslationKey | null,
  labelKey: TranslationKey,
  permission: bigint,
  reasonKey: TranslationKey,
  style: MessageComponentButtonStyles,
}> = {
  mute: {
    durationKey: 'commands.moderation.mute.duration.description',
    labelKey: 'moderation_warn.mute',
    permission: Permissions.MODERATE_MEMBERS,
    reasonKey: 'commands.moderation.mute.reason.description',
    style: MessageComponentButtonStyles.SECONDARY,
  },
  kick: {
    durationKey: null,
    labelKey: 'moderation_warn.kick',
    permission: Permissions.KICK_MEMBERS,
    reasonKey: 'commands.moderation.kick.reason.description',
    style: MessageComponentButtonStyles.SECONDARY,
  },
  ban: {
    durationKey: 'commands.moderation.ban.duration.description',
    labelKey: 'moderation_warn.ban',
    permission: Permissions.BAN_MEMBERS,
    reasonKey: 'commands.moderation.ban.reason.description',
    style: MessageComponentButtonStyles.DANGER,
  },
};

// users who left can be warned too, it's only kept on their record here
export interface CommandArgsBefore {
  payload: Parameters.BanPayload | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayload,
}

export type MemberCheckFailure = 'bot' | 'self' | 'your_role';

// why this member can't be warned (or null if they can), a warning isn't a discord action so only the moderator's role
// matters, and someone who left has no roles to be above
export function checkMember(
  context: Command.Context | Interaction.InteractionContext,
  member: Structures.Member | Structures.User,
): MemberCheckFailure | null {
  if ((context.me && context.me.id === member.id) || context.userId === member.id) {
    return 'self';
  }
  if (member.bot) {
    return 'bot';
  }
  if (member instanceof Structures.Member && (!context.member || !context.member.canEdit(member))) {
    return 'your_role';
  }
  return null;
}

function isMember(member: Structures.Member | Structures.User): member is Structures.Member {
  return member instanceof Structures.Member;
}

// "Active: 2 • Total: 5", for a member's warnings
// a ladder step's members (the ones whose warning reached it), and the permission that's missing if it can't be done:
// the moderator's skips it for someone who can, the bot's too. A mute or kick also skips the ones who left (a ban doesn't)
export interface AutomaticAction {
  members: Array<Structures.Member | Structures.User>,
  missing: null | {permission: bigint, who: 'me' | 'you'} | {who: 'left'},
  step: RestResponsesRaw.GuildWarningAction,
}

// what a step needs, kicking with deleted messages bans then unbans them
export function getWarningActionPermissions(step: RestResponsesRaw.GuildWarningAction): Array<bigint> {
  switch (step.action) {
    case 'ban': return [Permissions.BAN_MEMBERS];
    case 'kick': return (step.clean) ? [Permissions.KICK_MEMBERS, Permissions.BAN_MEMBERS] : [Permissions.KICK_MEMBERS];
    case 'mute': return [Permissions.MODERATE_MEMBERS];
  }
}

// "Mute • 1 hour", "Ban • deletes 1 day of their messages", a permanent ban has no duration
export function formatWarningAction(translator: Translator, step: RestResponsesRaw.GuildWarningAction): string {
  const { language, translate } = translator;
  return displayDetailsLine([
    translate(ACTIONS[step.action].labelKey),
    (step.duration) && formatDuration(step.duration * 1000, language),
    (step.clean) && translate('moderation_warn.auto_clean', {duration: formatDuration(step.clean * 1000, language)}),
  ]);
}

export function formatCounts(translator: Translator, counts: {active: number, total: number}): string {
  return displayDetailsLine([
    translator.translate('moderation_warnings.active', {count: counts.active.toLocaleString(translator.language)}),
    translator.translate('moderation_warnings.total', {count: counts.total.toLocaleString(translator.language)}),
  ]);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { label, language, translate } = translator;
  const { payload } = args;
  if (payload.overLimit) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation_warn.too_many_users', {max: MAX_GUILD_WARNING_USERS.toLocaleString(language)})}`});
  }

  const reason = payload.text.slice(0, MAX_GUILD_WARNING_REASON_LENGTH);

  const warnable: Array<Structures.Member | Structures.User> = [];
  const unable: Array<string> = [];
  for (let member of payload.membersOrUsers) {
    const failure = checkMember(context, member);
    if (failure) {
      const key = (failure === 'bot') ? 'moderation_warn.reason_bot' : `moderation_mute.reason_${failure}` as const;
      unable.push(`-> ${formatMember(member)}: ${translate(key)}`);
    } else {
      warnable.push(member);
    }
  }

  let counts: Record<string, {active: number, total: number}> = {};
  let steps: Record<string, RestResponsesRaw.GuildWarningAction> = {};
  let added: Array<string> = [];
  let window = 0;
  if (warnable.length) {
    try {
      const response = await putGuildWarnings(context, context.guildId!, {
        moderatorId: context.userId,
        reason: reason || null,
        userIds: warnable.map((member) => member.id),
      });
      counts = response.counts;
      steps = response.actions || {};
      added = response.warnings.map((warning) => warning.id);
      window = response.window;
      for (let warning of response.warnings) {
        const member = warnable.find((member) => member.id === warning.user_id);
        if (member) {
          GuildLoggingListener.logModeration(context.client, {
            guildId: context.guildId!,
            happened: Date.now(),
            name: GuildLoggingCustomEvents.GUILD_WARNING_ADD,
            payload: {counts: counts[member.id] || {active: 1, total: 1}, moderator: context.user, user: (isMember(member)) ? member.user : member, warning},
          });
        }
      }
    } catch(error) {
      const information = await getApiError(error);
      if (information && information.code === ApiErrorCodes.MAX_GUILD_WARNINGS) {
        const full = (information.user_ids || []) as Array<string>;
        const members = warnable.filter((member) => full.includes(member.id));
        return displayReply(context, {
          description: [
            `${StatusEmojis.WARNING} ${translate('moderation_warn.max_warnings', {limit: String(information.limit)})}`,
            ...members.map((member) => `-> ${formatMember(member)}`),
          ].join('\n'),
        });
      }
      throw error;
    }
  }

  // one member gets their earlier warnings under it, more than one only get their counts
  // the warning still went through if this fails, it just shows without them
  const single = (warnable.length === 1) ? warnable[0] : null;
  const pastRequest = (single) ? fetchGuildWarnings(context, context.guildId!, {
    limit: MAX_GUILD_WARNING_USER_AMOUNT,
    userId: single.id,
  }).catch(() => null) : Promise.resolve(null);

  // same block as mute/kick/ban, in the member's language (or the server's), the reason goes last since it can be long
  const createDetails = (translator: Translator): string => {
    return [
      translator.translate('moderation_mute.moderator', {user: formatUserTag(context.user), user2: context.user.id}),
      translator.translate('moderation_mute.date', {timestamp: createTimestampMomentFromGuild(Date.now(), context.guildId).format(DateMomentLogFormat)}),
      translator.translate('moderation_mute.reason', {text: reason || translator.translate('moderation.unspecified_reason')}),
    ].join('\n');
  };
  // sent once the reply is up, a warning doesn't remove them so they can still get it after (unlike a kick or ban)
  // kept so an undo can take them back
  const dms = new Map<string, Structures.Message>();
  const sendDms = async (): Promise<void> => {
    const guild = context.guild;
    if (!guild || !(await GuildSettingsStore.canModerationDm(context, guild.id, GuildModerationDmFlags.WARN))) {
      return;
    }
    const audit = await getGuildTranslator(context);
    const details = createDetails(audit);
    for (let member of warnable) {
      try {
        const dm = await getTranslatorForUser(context, member.id);
        const message = await member.createMessage([
          dm.translate('moderation_warn.you_have_been_warned_in', {guild: guild.id, name: Markup.escape.all(guild.name)}),
          '',
          dm.translate('moderation_mute.details', {reason: Markup.codeblock((dm.language === audit.language) ? details : createDetails(dm))}),
          formatCounts(dm, counts[member.id] || {active: 1, total: 1}),
        ].join('\n'));
        dms.set(member.id, message);
      } catch(error) {
        // they have dms closed
      }
    }
  };

  // the ladder steps the warnings reached, members on the same step go together
  const automatic: Array<AutomaticAction> = [];
  for (let member of warnable) {
    const step = steps[member.id];
    if (!step) {
      continue;
    }
    // a mute or kick can't happen to someone who isn't here anymore, they get their own line
    const left = step.action !== 'ban' && !isMember(member);
    const existing = automatic.find((x) => {
      return x.step.threshold === step.threshold && (!!x.missing && x.missing.who === 'left') === left;
    });
    if (existing) {
      existing.members.push(member);
      continue;
    }
    let missing: AutomaticAction['missing'] = (left) ? {who: 'left'} : null;
    for (let permission of (missing) ? [] : getWarningActionPermissions(step)) {
      if (!context.member || !context.member.can(permission)) {
        missing = {permission, who: 'you'};
      } else if (!context.me || !context.me.can(permission)) {
        missing = {permission, who: 'me'};
      }
      if (missing) {
        break;
      }
    }
    automatic.push({members: [member], missing, step});
  }

  // each step through its command, its result is its own message. Returns the ones that went through
  const runAutomatic = async (): Promise<Array<AutomaticAction>> => {
    const done: Array<AutomaticAction> = [];
    const audit = await getGuildTranslator(context);
    for (let action of automatic) {
      if (action.missing) {
        continue;
      }
      const { step } = action;
      const text = [
        audit.translate('moderation_warn.auto_reached', {count: step.threshold.toLocaleString(audit.language)}),
        reason,
      ].filter(Boolean).join(': ');
      const payload = {membersOrUsers: action.members, notFound: [], text};
      // the ones who left went on their own (skipped) step, unless it's a ban
      const membersPayload = {...payload, membersOrUsers: action.members.filter(isMember)};
      const options = {followUp: true};
      try {
        switch (step.action) {
          case 'ban': await ModerationBan.createMessage(context, {clean: step.clean, duration: step.duration ?? undefined, payload}, options); break;
          case 'kick': await ModerationKick.createMessage(context, {clean: step.clean, payload: membersPayload}, options); break;
          case 'mute': await ModerationMute.createMessage(context, {duration: step.duration ?? undefined, payload: membersPayload}, options); break;
        }
        done.push(action);
      } catch(error) {
        await displayReply(context, {description: `${StatusEmojis.WARNING} ${ModerationMute.formatError(error)}`}, {followUp: true}).catch(() => null);
      }
    }
    return done;
  };
  // the dms then the steps (a kick or ban dms them before they're gone), an undo waits for both
  let followUps: Promise<Array<AutomaticAction>> = Promise.resolve([]);

  const past = await pastRequest;
  const pages = chunkArray<RestResponsesRaw.GuildWarning>((past) ? past.warnings.filter((warning) => !added.includes(warning.id)) : [], PAST_WARNINGS_PER_PAGE);
  const pageLimit = Math.max(pages.length, 1);

  const description: Array<string> = [];
  if (warnable.length) {
    description.push(translate('moderation_warn.warned'));
    for (let member of warnable) {
      const line = `-> ${formatMember(member)}`;
      description.push((warnable.length === 1) ? line : `${line} • ${formatCounts(translator, counts[member.id] || {active: 1, total: 1})}`);
    }
    if (reason) {
      // all of it, on its own lines
      description.push(translate('moderation_mute.reason', {text: `\n${Markup.codeblock(reason)}`}));
    }
    for (let { members, missing, step } of automatic) {
      let skipped: string | null = null;
      if (missing && missing.who === 'left') {
        skipped = translate('moderation_warn.auto_skipped_left');
      } else if (missing) {
        const permission = Markup.codestring(label('permissions', (PermissionsText as any)[String(missing.permission)]));
        skipped = translate((missing.who === 'you') ? 'moderation_warn.auto_skipped_you' : 'moderation_warn.auto_skipped_me', {permission});
      }
      description.push(displayDetailsLine([
        (1 < warnable.length) && members.map((member) => member.mention).join(' '),
        translate('moderation_warn.auto_reached', {count: step.threshold.toLocaleString(language)}),
        formatWarningAction(translator, step),
        skipped,
      ], true));
    }
    description.push('');
  }
  if (unable.length) {
    description.push(translate('moderation_warn.unable'));
    description.push(...unable);
    description.push('');
  }
  if (payload.notFound.length) {
    description.push(translate('moderation_mute.not_found'));
    description.push(`-> ${payload.notFound.map((text) => Markup.escape.all(text)).join(', ')}`);
  }

  const createDisplay = (page: number): DisplayPayload => {
    return {
      blocks: (single && past) ? [createPastWarningsBlock(translator, pages[page - 1] || [], {
        counts: counts[single.id] || {active: 1, total: 1},
        page,
        pageLimit,
        window,
      })] : [],
      color: EmbedColors.DEFAULT,
      description: description.join('\n').trim(),
      note: (warnable.length) ? translate('moderation_warnings.window', {duration: formatDuration(window * 1000, language)}) : null,
    };
  };

  // any action stops the pages too, the warning stays on the page it was on without buttons
  const components = createActionComponents(context, translator, {
    added,
    banClean: await GuildSettingsStore.getBanClean(context, context.guildId!),
    // an undo before they've all gone out waits for them
    getFollowUps: async () => {
      const done = await followUps;
      return {automatic: done, dms: Array.from(dms.values())};
    },
    members: warnable,
    reason,
    stop: (clearButtons) => paginator.stop(clearButtons),
  });
  const reply = async () => {
    if (!components && pageLimit === 1) {
      return displayReply(context, createDisplay(1));
    }
    return paginator.start();
  };
  const paginator = new Paginator(context, {
    expire: ACTIONS_TIMEOUT,
    pageLimit,
    // the actions are the page's own rows, which stay when only the page buttons are cleared
    onExpire: (paginator) => {
      paginator.pageRows = [];
    },
    onPage: (page) => {
      return {
        display: {
          ...createDisplay(page),
          components: (components && !paginator.stopped) ? components : undefined,
          // the same spot with or without the past warnings (they'd go above those otherwise)
          componentsAboveNote: true,
        },
      };
    },
  });
  try {
    return await reply();
  } finally {
    // the warning's saved either way, they still get told (and the ladder still goes)
    followUps = sendDms().then(() => runAutomatic());
    await followUps;
  }
}


// a page of the member's warnings before this one (newest first), with their counts (and the page) beside the heading
function createPastWarningsBlock(
  translator: Translator,
  warnings: Array<RestResponsesRaw.GuildWarning>,
  options: {counts: {active: number, total: number}, page: number, pageLimit: number, window: number},
): DisplayBlock {
  const { translate } = translator;
  const block: DisplayBlock = {
    details: [
      formatCounts(translator, options.counts),
      (1 < options.pageLimit) && translate('common.page_of', {page: options.page, total: options.pageLimit}),
    ].filter(Boolean).join(' '),
    heading: translate('moderation_warn.past_warnings'),
  };
  if (!warnings.length) {
    block.content = `*${translate('moderation_warn.no_past_warnings')}*`;
    return block;
  }
  const lines: Array<string> = [];
  for (let warning of warnings) {
    lines.push((warning.reason) ? formatReasonLine(warning.reason) : `*${translate('moderation.unspecified_reason')}*`);
    lines.push(formatWarningDetails(translate, warning, options.window, false));
  }
  block.content = lines.join('\n');
  return block;
}


function refuse(modalContext: ComponentContext | InteractionModalContext, translator: Pick<Translator, 'translate'>, text: string) {
  return modalContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(modalContext, translator, {
    color: EmbedColors.ERROR,
    description: `${StatusEmojis.WARNING} ${text}`,
  }));
}


// kicking with deleted messages bans then unbans them, so both of us need ban members too (a ban already does)
function hasActionClean(action: WarnAction, member: Structures.Member | null | undefined, me: Structures.Member | null): boolean {
  return action === 'ban' || (action === 'kick' && [member, me].every((x) => !!x && x.can(Permissions.BAN_MEMBERS)));
}


// a mute/kick/ban modal's delete messages and duration fields, or why they can't be used
function parseActionArgs(
  context: ComponentContext | Command.Context | Interaction.InteractionContext,
  translator: Translator,
  action: WarnAction,
  args: InteractionModalArgs,
  hasClean: boolean,
): {clean: number, duration?: number} | string {
  const { translate } = translator;
  let clean = 0;
  const cleanText = String(args.clean || '').trim();
  if (hasClean && cleanText) {
    try {
      clean = Math.min(Parameters.secondsWithOptions({float: false})(cleanText, context), MAX_CLEAN);
    } catch(error: any) {
      return String((error && error.message) || error);
    }
  }

  let duration: number | undefined;
  const durationText = String(args.duration || '').trim();
  if (ACTIONS[action].durationKey && durationText) {
    try {
      duration = Parameters.secondsWithOptions({float: false})(durationText, context);
    } catch(error: any) {
      return String((error && error.message) || error);
    }
    if (action === 'mute' && (duration < 1 || ModerationMute.MAX_DURATION < duration)) {
      return translate('moderation_mute.invalid_duration');
    }
    if (action === 'ban' && (duration < ModerationBan.TIMED_BAN_MIN_DURATION || ModerationBan.TIMED_BAN_MAX_DURATION < duration)) {
      return translate('moderation_ban.timed_invalid_duration');
    }
  }
  return {clean, duration};
}


// how long (mute/ban), how far back to delete their messages (ban, and kick when both of us can ban) and why, the reason
// starts as the warning's
function createActionModal(
  translator: Translator,
  action: WarnAction,
  options: {
    banClean: number,
    hasClean: boolean,
    reason: null | string,
    username: null | string,
    run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => Promise<unknown>,
    onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => Promise<unknown>,
  },
): InteractionModal {
  const { translate } = translator;
  const { durationKey, labelKey, reasonKey } = ACTIONS[action];
  // discord caps modal titles at 45
  const title = (options.username) ? `${translate(labelKey)}: ${options.username}` : translate(labelKey);
  const modal = new InteractionModal({title: title.slice(0, 45), run: options.run, onError: options.onError});
  if (durationKey) {
    modal.createLabel({description: translate(durationKey), label: translate('moderation_warn.duration')}).createInputText({
      customId: 'duration',
      maxLength: 50,
      required: false,
      style: MessageComponentInputTextStyles.SHORT,
      value: ACTION_DEFAULT_DURATIONS[action],
    });
  }
  // optional, empty deletes none
  if (options.hasClean) {
    modal.createLabel({description: translate('moderation_warn.clean_description'), label: translate('moderation_warn.clean')}).createInputText({
      customId: 'clean',
      maxLength: 50,
      required: false,
      style: MessageComponentInputTextStyles.SHORT,
      value: (action === 'ban') ? formatCleanInput(options.banClean) : undefined,
    });
  }
  modal.createLabel({description: translate(reasonKey), label: translate('moderation_warn.reason')}).createInputText({
    customId: 'reason',
    maxLength: MAX_GUILD_WARNING_REASON_LENGTH,
    required: false,
    style: MessageComponentInputTextStyles.PARAGRAPH,
    value: options.reason || undefined,
  });
  return modal;
}


// buttons for whoever warned them: undo takes the warning back (and its dm), prune opens a modal with how many of their
// messages to delete here, mute/kick/ban each open a modal with the
// warning's reason filled in (and how long), their result is its own message and the warning only loses its buttons.
// Only the actions both of us have permissions for
function createActionComponents(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  options: {
    // the warnings just made
    added: Array<string>,
    // what the ban modal's delete messages field starts as, the server's `ban_clean`
    banClean: number,
    // the dms and the ladder steps that went through, once they're done
    getFollowUps: () => Promise<{automatic: Array<AutomaticAction>, dms: Array<Structures.Message>}>,
    members: Array<Structures.Member | Structures.User>,
    reason: string,
    // the message's buttons go (or stay for the caller to replace the whole thing)
    stop: (clearButtons: boolean) => Promise<unknown>,
  },
): Components | null {
  const { translate } = translator;
  const { added, banClean, getFollowUps, members, reason, stop } = options;
  if (!members.length || !added.length) {
    return null;
  }
  // a mute or kick needs them all still here, a ban doesn't
  const allMembers = members.every(isMember);
  const actions = (Object.keys(ACTIONS) as Array<WarnAction>).filter((action) => {
    if (action !== 'ban' && !allMembers) {
      return false;
    }
    const { permission } = ACTIONS[action];
    return !!context.member && context.member.can(permission) && !!context.me && context.me.can(permission);
  });

  // once one goes through, the rest go with it. They're shown as the paginator's page rows, its listener (and timeout)
  // is the one on the message
  let done = false;
  const components = new Components();

  const hasClean = (action: WarnAction): boolean => hasActionClean(action, context.member, context.me);

  const run = async (modalContext: InteractionModalContext, action: WarnAction, args: InteractionModalArgs) => {
    const parsed = parseActionArgs(context, translator, action, args, hasClean(action));
    if (typeof(parsed) === 'string') {
      return refuse(modalContext, translator, parsed);
    }
    const { clean, duration } = parsed;
    // another modal from the same warning went through first
    if (done) {
      return modalContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    }
    done = true;

    // kicks and bans dm everyone first, longer than discord waits for a response
    await modalContext.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
    // the warning got deleted if this fails, still do it
    await stop(true).catch(() => null);

    const payload = {membersOrUsers: members, notFound: [], text: String(args.reason || '').trim()};
    // only shown when they're all members
    const membersPayload = {...payload, membersOrUsers: members.filter(isMember)};
    const options = {replyTo: modalContext};
    switch (action) {
      case 'ban': return ModerationBan.createMessage(context, {clean, duration, payload}, options);
      case 'kick': return ModerationKick.createMessage(context, {clean, payload: membersPayload}, options);
      case 'mute': return ModerationMute.createMessage(context, {duration, payload: membersPayload}, options);
    }
  };

  const createModal = (action: WarnAction): InteractionModal => {
    return createActionModal(translator, action, {
      banClean,
      hasClean: hasClean(action),
      reason,
      username: (members.length === 1) ? members[0].username : null,
      run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => run(modalContext, action, args),
      onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${ModerationMute.formatError(error)}`}, {replyTo: modalContext});
      },
    });
  };

  components.createButton({
    label: translate('moderation_warn.undo'),
    style: MessageComponentButtonStyles.SECONDARY,
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId || done) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      done = true;
      // a request each, more than discord waits for with a few members
      await ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      for (let id of added) {
        try {
          const warning = await deleteGuildWarning(context, context.guildId!, id);
          GuildLoggingListener.logModeration(context.client, {
            guildId: context.guildId!,
            happened: Date.now(),
            name: GuildLoggingCustomEvents.GUILD_WARNING_REMOVE,
            payload: {moderator: context.user, user: context.client.users.get(warning.user_id) || null, warning},
          });
        } catch(error) {
          const information = await getApiError(error);
          // already removed with `warnings remove`
          if (!information || information.code !== ApiErrorCodes.UNKNOWN_GUILD_WARNING) {
            throw error;
          }
        }
      }
      const { automatic, dms } = await getFollowUps();
      for (let message of dms) {
        try {
          await message.delete();
        } catch(error) {
          // they still got it, nothing else to do
        }
      }
      // the mutes and bans the ladder did go with it, a kick can't be taken back
      const audit = await getGuildTranslator(context);
      const undoReason = audit.translate('moderation_warn.undo_audit_reason', {user: formatUserTag(context.user)});
      let reverted = false;
      for (let { members, step } of automatic) {
        for (let member of members) {
          try {
            if (step.action === 'mute' && isMember(member)) {
              await member.edit({communicationDisabledUntil: null, reason: undoReason});
              reverted = true;
            } else if (step.action === 'ban') {
              await context.rest.removeGuildBan(context.guildId!, member.id, {reason: undoReason});
              reverted = true;
            }
          } catch(error) {
            // unmuted or unbanned already
          }
        }
        if (step.action === 'ban' && step.duration) {
          await deleteGuildTimedBans(context, context.guildId!, {userIds: members.map((member) => member.id)}).catch(() => null);
        }
      }
      // replaced below, the pages go with it
      await stop(false);
      return displayReply(context, {
        color: EmbedColors.DEFAULT,
        description: [
          translate((1 < added.length) ? 'moderation_warn.undone_multiple' : 'moderation_warn.undone'),
          ...members.map((member) => `-> ${formatMember(member)}`),
          (reverted) && displayDetailsLine([translate('moderation_warn.auto_reverted')], true),
        ].filter(Boolean).join('\n'),
      }, {replyTo: ctx});
    },
  });

  // deletes their latest messages in this channel, it isn't a punishment so the other actions stay. Shown for ones who left
  // too (like ban), it only goes by their ids
  // checked again on press and on submit with the interaction's member, the warning stays up long enough for either of us
  // to lose them
  const getPruneRefusal = (member?: Structures.Member | null): string | null => {
    const channel = context.channels.get(context.channelId!);
    const command = Markup.codestring(translate('moderation_warn.prune'));
    const format = (failed: Array<bigint>) => {
      return failed.map((permission) => Markup.codestring(translator.label('permissions', (PermissionsText as any)[String(permission)]))).join(', ');
    };
    const failedUser = PRUNE_PERMISSIONS.filter((permission) => !channel || !member || !channel.can(permission, member));
    if (failedUser.length) {
      return translate('errors.prefix_user_missing_permissions', {command, permissions: format(failedUser)});
    }
    const failedBot = PRUNE_PERMISSIONS.filter((permission) => !channel!.can(permission));
    if (failedBot.length) {
      return translate('errors.prefix_bot_missing_permissions', {command, permissions: format(failedBot)});
    }
    return null;
  };
  if (!getPruneRefusal(context.member)) {
    const pruneModal = (): InteractionModal => {
      const label = translate('moderation_warn.prune');
      const title = (members.length === 1) ? `${label}: ${members[0].username}` : label;
      const modal = new InteractionModal({
        title: title.slice(0, 45),
        run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
          const amount = Number(String(args.amount || '').trim());
          if (!Number.isInteger(amount) || amount < 1 || PRUNE_MAX_AMOUNT < amount) {
            return refuse(modalContext, translator, translate('moderation_warn.prune_invalid_amount', {max: PRUNE_MAX_AMOUNT.toLocaleString(translator.language)}));
          }
          // never further back than two weeks, empty (or 0) goes all the way to it
          let seconds = PRUNE_MAX_SINCE;
          const sinceText = String(args.since || '').trim();
          if (sinceText) {
            try {
              seconds = Math.min(Parameters.secondsWithOptions({float: false})(sinceText, context), PRUNE_MAX_SINCE) || PRUNE_MAX_SINCE;
            } catch(error: any) {
              return refuse(modalContext, translator, String((error && error.message) || error));
            }
          }
          const since = Date.now() - seconds * 1000;
          const refusal = getPruneRefusal(modalContext.member);
          if (refusal) {
            return refuse(modalContext, translator, refusal);
          }
          // a mute/kick/ban from the same warning went through first
          if (done) {
            return modalContext.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }
          // walking back through the channel can take longer than discord waits for a response
          await modalContext.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE);
          // the modal was the confirmation, it only asks again when the search stopped before finding them all. Our responses
          // to their commands go along with their messages, so there can be more than `amount`
          return ModerationPrune.createMessage(context, {amount, from: members, since}, {replyTo: modalContext, skipConfirmationUpTo: Infinity});
        },
        onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
          return displayReply(context, {description: `${StatusEmojis.WARNING} ${ModerationMute.formatError(error)}`}, {replyTo: modalContext});
        },
      });
      modal.createLabel({
        description: translate('moderation_warn.prune_amount_description', {max: PRUNE_MAX_AMOUNT.toLocaleString(translator.language)}),
        label: translate('moderation_warn.prune_amount'),
      }).createInputText({
        customId: 'amount',
        maxLength: String(PRUNE_MAX_AMOUNT).length,
        required: true,
        style: MessageComponentInputTextStyles.SHORT,
        value: String(PRUNE_DEFAULT_AMOUNT),
      });
      modal.createLabel({description: translate('moderation_warn.prune_since_description'), label: translate('moderation_warn.prune_since')}).createInputText({
        customId: 'since',
        maxLength: 50,
        required: false,
        style: MessageComponentInputTextStyles.SHORT,
      });
      return modal;
    };
    components.createButton({
      label: translate('moderation_warn.prune'),
      style: MessageComponentButtonStyles.SECONDARY,
      run: async (ctx: ComponentContext) => {
        if (ctx.userId !== context.userId || done) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }
        const refusal = getPruneRefusal(ctx.member);
        if (refusal) {
          return refuse(ctx, translator, refusal);
        }
        return ctx.respond(pruneModal());
      },
    });
  }

  for (let action of actions) {
    components.createButton({
      label: translate(ACTIONS[action].labelKey),
      style: ACTIONS[action].style,
      run: async (ctx: ComponentContext) => {
        // only whoever warned them, it's their name on it
        if (ctx.userId !== context.userId || done) {
          return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
        }
        return ctx.respond(createModal(action));
      },
    });
  }
  return components;
}


// the undo button on a moderation logger's warning, the same permission as `warn`
const WARNING_LOG_UNDO = 'undo';
const WARNING_LOG_UNDO_PERMISSION = Permissions.MODERATE_MEMBERS;

// the same text as a command's missing permissions, with the button's label as the command. Undo is only our api, so it
// doesn't need anything from me
function getLogActionRefusal(
  translator: Translator,
  label: string,
  permission: bigint,
  member: Structures.Member | null | undefined,
  me: Structures.Member | null,
  needsMe: boolean,
): null | string {
  const { translate } = translator;
  const command = Markup.codestring(label);
  const permissions = Markup.codestring(translator.label('permissions', (PermissionsText as any)[String(permission)]));
  if (!member || !member.can(permission)) {
    return translate('errors.prefix_user_missing_permissions', {command, permissions});
  }
  if (needsMe && (!me || !me.can(permission))) {
    return translate('errors.prefix_bot_missing_permissions', {command, permissions});
  }
  return null;
}


// `guild-warning.{action}.{userId}.{warningId}`, the buttons on a moderation logger's warning (`addGuildWarningAddButtons`).
// Unlike the ones under `warn` anyone with the action's permission can use them (checked on press and again on submit),
// and they stay, so the results are only shown to whoever pressed them. Undo only takes the warning back, the dm and any
// automatic mute or ban it caused aren't known here
export async function onGuildWarningLogComponent(context: ComponentContext, action: string, userId: string, warningId: string) {
  // cached only, the click has to be answered quickly
  const translator = getCachedTranslator(context);
  const { translate, translateMaybe } = translator;
  const guildId = context.guildId;
  const isUndo = action === WARNING_LOG_UNDO;
  if (!guildId || !userId || !warningId || (!isUndo && !(action in ACTIONS))) {
    return context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  }

  if (isUndo) {
    const refusal = getLogActionRefusal(translator, translate('moderation_warn.undo'), WARNING_LOG_UNDO_PERMISSION, context.member, context.me, false);
    if (refusal) {
      return refuse(context, translator, refusal);
    }
    await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
    let warning: RestResponsesRaw.DeleteGuildWarning;
    try {
      warning = await deleteGuildWarning(context, guildId, warningId);
    } catch(error) {
      // already removed (with this button, `warnings remove` or the dashboard)
      const apiError = await getApiError(error);
      if (!apiError) {
        throw error;
      }
      const key = getApiErrorTranslationKey(apiError.code);
      const text = (key) ? translateMaybe(key, apiError.message) : apiError.message;
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${text}`}, {replyTo: context});
    }
    const user = context.users.get(warning.user_id) || null;
    GuildLoggingListener.logModeration(context.client, {
      guildId,
      happened: Date.now(),
      name: GuildLoggingCustomEvents.GUILD_WARNING_REMOVE,
      payload: {moderator: context.user, user, warning},
    });
    return displayReply(context, {
      color: EmbedColors.DEFAULT,
      description: [
        translate('moderation_warn.undone'),
        `-> ${(user) ? formatMember(user) : `<@${warning.user_id}>`}`,
      ].join('\n'),
    }, {replyTo: context});
  }

  const warnAction = action as WarnAction;
  const { labelKey, permission } = ACTIONS[warnAction];
  const label = translate(labelKey);
  {
    const refusal = getLogActionRefusal(translator, label, permission, context.member, context.me, true);
    if (refusal) {
      return refuse(context, translator, refusal);
    }
  }

  const settings = GuildSettingsStore.get(guildId);
  const cached = (context.guild && context.guild.members.get(userId)) || context.users.get(userId) || null;
  return context.respond(createActionModal(translator, warnAction, {
    banClean: (settings) ? settings.settings.banClean : BAN_CLEAN_DEFAULT,
    hasClean: hasActionClean(warnAction, context.member, context.me),
    // only the warning's id is on the button, fetching its reason could take longer than discord waits for the modal
    reason: null,
    username: (cached) ? cached.username : null,
    run: async (modalContext: InteractionModalContext, args: InteractionModalArgs) => {
      // either of us could have lost it since the press
      const refusal = getLogActionRefusal(translator, label, permission, modalContext.member, modalContext.me, true);
      if (refusal) {
        return refuse(modalContext, translator, refusal);
      }
      const parsed = parseActionArgs(context, translator, warnAction, args, hasActionClean(warnAction, modalContext.member, modalContext.me));
      if (typeof(parsed) === 'string') {
        return refuse(modalContext, translator, parsed);
      }
      const { clean, duration } = parsed;

      // kicks and bans dm them first, longer than discord waits for a response
      await modalContext.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {flags: MessageFlags.EPHEMERAL});
      // they could have left (only a ban still works then) or not be cached anymore since the warning
      let member: Structures.Member | null = (context.guild && context.guild.members.get(userId)) || null;
      if (!member) {
        member = await context.rest.fetchGuildMember(guildId, userId).catch(() => null);
      }
      let user: Structures.Member | Structures.User | null = member;
      if (!user && warnAction === 'ban') {
        user = context.users.get(userId) || await context.rest.fetchUser(userId).catch(() => null);
      }
      const text = String(args.reason || '').trim();
      const options = {replyTo: modalContext};
      switch (warnAction) {
        case 'ban': {
          const payload = {membersOrUsers: (user) ? [user] : [], notFound: (user) ? [] : [userId], text};
          return ModerationBan.createMessage(context, {clean, duration, payload}, options);
        };
        case 'kick': {
          const payload = {membersOrUsers: (member) ? [member] : [], notFound: (member) ? [] : [userId], text};
          return ModerationKick.createMessage(context, {clean, payload}, options);
        };
        case 'mute': {
          const payload = {membersOrUsers: (member) ? [member] : [], notFound: (member) ? [] : [userId], text};
          return ModerationMute.createMessage(context, {duration, payload}, options);
        };
      }
    },
    onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${ModerationMute.formatError(error)}`}, {replyTo: modalContext});
    },
  }));
}
