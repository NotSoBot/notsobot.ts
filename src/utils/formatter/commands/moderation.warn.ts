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

import { deleteGuildTimedBans, deleteGuildWarning, fetchGuildWarnings, putGuildWarnings } from '../../../api';
import { getApiError } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import GuildLoggingStore from '../../../stores/guildlogging';
import {
  ApiErrorCodes,
  DateMomentLogFormat,
  EmbedColors,
  MAX_GUILD_WARNING_REASON_LENGTH,
  MAX_GUILD_WARNING_USER_AMOUNT,
  MAX_GUILD_WARNING_USERS,
  PermissionsText,
  StatusEmojis,
} from '../../../constants';
import { TranslationKey, Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
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
} from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import * as ModerationBan from './moderation.ban';
import * as ModerationKick from './moderation.kick';
import * as ModerationMute from './moderation.mute';
import { formatMember } from './moderation.mute';
import { formatReasonLine, formatWarningDetails } from './moderation.warnings';


export const COMMAND_ID = 'moderation.warn';

// a member's earlier warnings under a warning, paged
export const PAST_WARNINGS_PER_PAGE = 4;
// how long the buttons (pages and actions) stay under a warning after the last press
export const ACTIONS_TIMEOUT = 5 * 60 * 1000;

export type WarnAction = 'ban' | 'kick' | 'mute';

// what the duration field starts as, a ban emptied out is permanent
const ACTION_DEFAULT_DURATIONS: Partial<Record<WarnAction, string>> = {ban: '7d', mute: '1h'};
// what the delete messages field starts as, emptied out deletes none
const ACTION_DEFAULT_CLEANS: Partial<Record<WarnAction, string>> = {ban: '1d'};
// discord only deletes messages from up to a week back
const MAX_CLEAN = 7 * 24 * 60 * 60;

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

export interface CommandArgsBefore {
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayloadMembersOnly,
}

export type MemberCheckFailure = 'bot' | 'self' | 'your_role';

// why this member can't be warned (or null if they can), a warning isn't a discord action so only the moderator's role matters
export function checkMember(
  context: Command.Context | Interaction.InteractionContext,
  member: Structures.Member,
): MemberCheckFailure | null {
  if ((context.me && context.me.id === member.id) || context.userId === member.id) {
    return 'self';
  }
  if (member.bot) {
    return 'bot';
  }
  if (!context.member || !context.member.canEdit(member)) {
    return 'your_role';
  }
  return null;
}

// "Active: 2 • Total: 5", for a member's warnings
// a ladder step's members (the ones whose warning reached it), and the permission that's missing if it can't be done:
// the moderator's skips it for someone who can, the bot's too
export interface AutomaticAction {
  members: Array<Structures.Member>,
  missing: null | {permission: bigint, who: 'me' | 'you'},
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

  const warnable: Array<Structures.Member> = [];
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
          GuildLoggingStore.logModeration(context.client, {
            guildId: context.guildId!,
            happened: Date.now(),
            name: GuildLoggingCustomEvents.GUILD_WARNING_ADD,
            payload: {counts: counts[member.id] || {active: 1, total: 1}, moderator: context.user, user: member.user, warning},
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
    if (!guild) {
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
    const existing = automatic.find((x) => x.step.threshold === step.threshold);
    if (existing) {
      existing.members.push(member);
      continue;
    }
    let missing: AutomaticAction['missing'] = null;
    for (let permission of getWarningActionPermissions(step)) {
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
      const options = {followUp: true};
      try {
        switch (step.action) {
          case 'ban': await ModerationBan.createMessage(context, {clean: step.clean, duration: step.duration ?? undefined, payload}, options); break;
          case 'kick': await ModerationKick.createMessage(context, {clean: step.clean, payload}, options); break;
          case 'mute': await ModerationMute.createMessage(context, {duration: step.duration ?? undefined, payload}, options); break;
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
      if (missing) {
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


// buttons for whoever warned them: undo takes the warning back (and its dm), mute/kick/ban each open a modal with the
// warning's reason filled in (and how long), their result is its own message and the warning only loses its buttons.
// Only the actions both of us have permissions for
function createActionComponents(
  context: Command.Context | Interaction.InteractionContext,
  translator: Translator,
  options: {
    // the warnings just made
    added: Array<string>,
    // the dms and the ladder steps that went through, once they're done
    getFollowUps: () => Promise<{automatic: Array<AutomaticAction>, dms: Array<Structures.Message>}>,
    members: Array<Structures.Member>,
    reason: string,
    // the message's buttons go (or stay for the caller to replace the whole thing)
    stop: (clearButtons: boolean) => Promise<unknown>,
  },
): Components | null {
  const { translate } = translator;
  const { added, getFollowUps, members, reason, stop } = options;
  if (!members.length || !added.length) {
    return null;
  }
  const actions = (Object.keys(ACTIONS) as Array<WarnAction>).filter((action) => {
    const { permission } = ACTIONS[action];
    return !!context.member && context.member.can(permission) && !!context.me && context.me.can(permission);
  });

  // once one goes through, the rest go with it. They're shown as the paginator's page rows, its listener (and timeout)
  // is the one on the message
  let done = false;
  const components = new Components();

  const refuse = (modalContext: InteractionModalContext, text: string) => {
    return modalContext.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      allowedMentions: {parse: []},
      content: `${StatusEmojis.WARNING} ${text}`,
      flags: MessageFlags.EPHEMERAL,
    });
  };

  // kicking with deleted messages bans then unbans them, so both of us need ban members too (a ban already does)
  const canKickClean = [context.member, context.me].every((member) => !!member && member.can(Permissions.BAN_MEMBERS));
  const hasClean = (action: WarnAction): boolean => action === 'ban' || (action === 'kick' && canKickClean);

  const run = async (modalContext: InteractionModalContext, action: WarnAction, args: InteractionModalArgs) => {
    let clean = 0;
    const cleanText = String(args.clean || '').trim();
    if (hasClean(action) && cleanText) {
      try {
        clean = Math.min(Parameters.secondsWithOptions({float: false})(cleanText, context), MAX_CLEAN);
      } catch(error: any) {
        return refuse(modalContext, String((error && error.message) || error));
      }
    }

    let duration: number | undefined;
    const durationText = String(args.duration || '').trim();
    if (ACTIONS[action].durationKey && durationText) {
      try {
        duration = Parameters.secondsWithOptions({float: false})(durationText, context);
      } catch(error: any) {
        return refuse(modalContext, String((error && error.message) || error));
      }
      if (action === 'mute' && (duration < 1 || ModerationMute.MAX_DURATION < duration)) {
        return refuse(modalContext, translate('moderation_mute.invalid_duration'));
      }
      if (action === 'ban' && (duration < ModerationBan.TIMED_BAN_MIN_DURATION || ModerationBan.TIMED_BAN_MAX_DURATION < duration)) {
        return refuse(modalContext, translate('moderation_ban.timed_invalid_duration'));
      }
    }
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
    const options = {replyTo: modalContext};
    switch (action) {
      case 'ban': return ModerationBan.createMessage(context, {clean, duration, payload}, options);
      case 'kick': return ModerationKick.createMessage(context, {clean, payload}, options);
      case 'mute': return ModerationMute.createMessage(context, {duration, payload}, options);
    }
  };

  const createModal = (action: WarnAction): InteractionModal => {
    const { durationKey, labelKey, reasonKey } = ACTIONS[action];
    // discord caps modal titles at 45
    const title = (members.length === 1) ? `${translate(labelKey)}: ${members[0].username}` : translate(labelKey);
    const modal = new InteractionModal({
      title: title.slice(0, 45),
      run: (modalContext: InteractionModalContext, args: InteractionModalArgs) => run(modalContext, action, args),
      onError: (modalContext: InteractionModalContext, args: InteractionModalArgs, error: any) => {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${ModerationMute.formatError(error)}`}, {replyTo: modalContext});
      },
    });
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
    if (hasClean(action)) {
      modal.createLabel({description: translate('moderation_warn.clean_description'), label: translate('moderation_warn.clean')}).createInputText({
        customId: 'clean',
        maxLength: 50,
        required: false,
        style: MessageComponentInputTextStyles.SHORT,
        value: ACTION_DEFAULT_CLEANS[action],
      });
    }
    modal.createLabel({description: translate(reasonKey), label: translate('moderation_warn.reason')}).createInputText({
      customId: 'reason',
      maxLength: MAX_GUILD_WARNING_REASON_LENGTH,
      required: false,
      style: MessageComponentInputTextStyles.PARAGRAPH,
      value: reason || undefined,
    });
    return modal;
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
          GuildLoggingStore.logModeration(context.client, {
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
            if (step.action === 'mute') {
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
