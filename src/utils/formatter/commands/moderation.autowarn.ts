import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildTimedBans, editGuildSettings, putGuildTimedBans, putGuildWarnings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { RestResponsesRaw } from '../../../api/types';
import GuildLoggingStore from '../../../stores/guildlogging';
import GuildSettingsStore from '../../../stores/guildsettings';
import {
  DateMomentLogFormat,
  EmbedColors,
  GuildWarningAutoTriggers,
  MAX_GUILD_WARNING_WEIGHT,
  MAX_GUILD_WARNINGS_AUTO,
  MAX_GUILD_WARNINGS_AUTO_MENTIONS,
  StatusEmojis,
} from '../../../constants';
import { Translator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { createTimestampMomentFromGuild, displayDetailsLine, displayReply, formatUserTag } from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import { formatCounts, formatWarningAction, getWarningActionPermissions } from './moderation.warn';


export const COMMAND_ID = 'server.autowarn.list';
// the commands changing them, through `createSetMessage`
export const COMMAND_ID_BLOCKED = 'server.autowarn.blocked';
export const COMMAND_ID_MENTIONS = 'server.autowarn.mentions';
export const COMMAND_ID_REMOVE = 'server.autowarn.remove';

// one auto-warn per member for each trigger this often, so a burst of blocked commands (or mention spam) is one warning
export const AUTO_WARN_COOLDOWN = 10 * 1000;
// how long a message stays warned for, an edit to it (which runs it through again) doesn't warn them twice
export const AUTO_WARN_MESSAGE_MEMORY = 15 * 60 * 1000;

// `guild id.user id.trigger` -> when they were last auto-warned for it
const cooldowns = new Collections.BaseCollection<string, number>({expire: AUTO_WARN_COOLDOWN});
const warnedMessages = new Collections.BaseCollection<string, boolean>({expire: AUTO_WARN_MESSAGE_MEMORY});


// the rule for `trigger` where this happened: the channel's own, then its parent's (a thread's channel or a channel's
// category), then its parent's parent, then the server-wide one
export function resolveGuildWarningAuto(
  settings: GuildSettings,
  trigger: GuildWarningAutoTriggers,
  channel: Structures.Channel | null,
  channelId: string | null,
): RestResponsesRaw.GuildWarningAuto | null {
  const rules = ((settings.settings) ? settings.settings.warningsAuto : []).filter((rule) => rule.trigger === trigger);
  if (!rules.length) {
    return null;
  }
  const parent = (channel) ? channel.parent : null;
  for (let id of [channelId, channel && channel.parentId, parent && parent.parentId]) {
    const rule = (id) ? rules.find((rule) => rule.channel_id === id) : null;
    if (rule) {
      return rule;
    }
  }
  return rules.find((rule) => !rule.channel_id) || null;
}


// the users and roles a message mentions in its content, a reply's ping isn't counted and neither is the author
export function countMessageMentions(message: Structures.Message): number {
  let count = message.mentionRoles.size;
  for (let userId of message.mentions.keys()) {
    if (userId !== message.author.id && message.content.includes(userId)) {
      count++;
    }
  }
  return count;
}


// "More than 5 mentions in a message", "Using a blocked command"
export function describeGuildWarningAuto(translate: Translator['translate'], rule: RestResponsesRaw.GuildWarningAuto): string {
  switch (rule.trigger) {
    case GuildWarningAutoTriggers.BLOCKED_COMMAND: return translate('moderation_autowarn.trigger_blocked_command');
    case GuildWarningAutoTriggers.MENTIONS: return translate('moderation_autowarn.trigger_mentions', {limit: String(rule.limit)});
  }
  return rule.trigger;
}


export function formatWarningWeight(translator: Translator, weight: number): string {
  if (weight === 1) {
    return translator.translate('moderation_autowarn.counts_as_one');
  }
  return translator.translate('moderation_autowarn.counts_as', {count: weight.toLocaleString(translator.language)});
}


// "More than 5 mentions in a message • #general • Counts as 2 warnings"
export function formatGuildWarningAuto(translator: Translator, rule: RestResponsesRaw.GuildWarningAuto): string {
  return displayDetailsLine([
    describeGuildWarningAuto(translator.translate, rule),
    (rule.channel_id) ? `<#${rule.channel_id}>` : translator.translate('moderation_autowarn.anywhere'),
    formatWarningWeight(translator, rule.warnings),
  ]);
}


export function formatGuildWarningsAuto(translator: Translator, rules: Array<RestResponsesRaw.GuildWarningAuto>): string {
  const { translate } = translator;
  if (!rules.length) {
    return translate('moderation_autowarn.none');
  }
  return [
    translate('moderation_autowarn.rules'),
    ...rules.map((rule) => `-> ${formatGuildWarningAuto(translator, rule)}`),
    `-# ${translate('moderation_autowarn.ladder_note')}`,
  ].join('\n');
}


export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs = {},
) {
  const translator = await getTranslator(context);
  const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  if (!settings) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translator.translate('settings_server_set_warnings.error_fetching')}`, ephemeral: true});
  }
  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: formatGuildWarningsAuto(translator, settings.settings.warningsAuto || []),
    ephemeral: true,
  });
}


// what `autowarn remove` takes for each trigger
export const TRIGGER_VALUES: Record<string, GuildWarningAutoTriggers> = Object.freeze({
  blocked: GuildWarningAutoTriggers.BLOCKED_COMMAND,
  blocked_command: GuildWarningAutoTriggers.BLOCKED_COMMAND,
  commands: GuildWarningAutoTriggers.BLOCKED_COMMAND,
  mention: GuildWarningAutoTriggers.MENTIONS,
  mentions: GuildWarningAutoTriggers.MENTIONS,
  pings: GuildWarningAutoTriggers.MENTIONS,
});

export function triggerParser(value: string): GuildWarningAutoTriggers | null {
  return TRIGGER_VALUES[value.trim().toLowerCase()] || null;
}

// where a rule goes, server-wide without one
export const CHANNEL_TYPES = Object.freeze([
  ChannelTypes.GUILD_CATEGORY,
  ChannelTypes.GUILD_FORUM,
  ChannelTypes.GUILD_MEDIA,
  ChannelTypes.GUILD_NEWS,
  ChannelTypes.GUILD_STAGE_VOICE,
  ChannelTypes.GUILD_TEXT,
  ChannelTypes.GUILD_VOICE,
]);

export interface SetArgs {
  // null: anywhere
  channel: Structures.Channel | null,
  // mentions: the most users and roles a message can mention
  limit?: number,
  // removes the rule instead
  remove?: boolean,
  trigger: GuildWarningAutoTriggers,
  // how many warnings it counts as (1 by default)
  warnings?: number,
}

// adds (or replaces) the trigger's rule for the channel, or removes it
export async function createSetMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: SetArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const reply = (text: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${text}`, ephemeral: true});

  const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  if (!settings) {
    return reply(translate('settings_server_set_warnings.error_fetching'));
  }
  const channelId = (args.channel) ? args.channel.id : null;
  const rules = settings.settings.warningsAuto || [];
  const others = rules.filter((rule) => !(rule.trigger === args.trigger && rule.channel_id === channelId));

  let rule: RestResponsesRaw.GuildWarningAuto | null = null;
  if (args.remove) {
    if (others.length === rules.length) {
      return reply(translate('moderation_autowarn.not_found'));
    }
  } else {
    const warnings = (args.warnings === undefined) ? 1 : args.warnings;
    if (!Number.isInteger(warnings) || warnings < 1 || MAX_GUILD_WARNING_WEIGHT < warnings) {
      return reply(translate('moderation_autowarn.invalid_warnings', {max: MAX_GUILD_WARNING_WEIGHT.toLocaleString(language)}));
    }
    let limit: number | null = null;
    if (args.trigger === GuildWarningAutoTriggers.MENTIONS) {
      limit = (args.limit === undefined) ? NaN : args.limit;
      if (!Number.isInteger(limit) || limit < 1 || MAX_GUILD_WARNINGS_AUTO_MENTIONS < limit) {
        return reply(translate('moderation_autowarn.invalid_limit', {max: MAX_GUILD_WARNINGS_AUTO_MENTIONS.toLocaleString(language)}));
      }
    }
    if (MAX_GUILD_WARNINGS_AUTO <= others.length) {
      return reply(translate('moderation_autowarn.max_rules', {max: MAX_GUILD_WARNINGS_AUTO.toLocaleString(language)}));
    }
    rule = {channel_id: channelId, limit, trigger: args.trigger, warnings};
  }

  const { settings: updated } = await editGuildSettings(context, context.guildId!, {
    warningsAuto: (rule) ? [...others, rule] : others,
  });
  const description = [
    translate((rule) ? 'moderation_autowarn.added' : 'moderation_autowarn.removed', {
      rule: formatGuildWarningAuto(translator, rule || rules.find((x) => x.trigger === args.trigger && x.channel_id === channelId)!),
    }),
    '',
    formatGuildWarningsAuto(translator, updated.warningsAuto || []),
  ];
  // blocked commands only come from the server's rules
  if (rule && rule.trigger === GuildWarningAutoTriggers.BLOCKED_COMMAND && !settings.rules.some((x) => !x.allows)) {
    description.push(`-# ${translate('moderation_autowarn.no_block_rules')}`);
  }
  return displayReply(context, {color: EmbedColors.DEFAULT, description: description.join('\n'), ephemeral: true});
}



export interface AutoWarnOptions {
  member: Structures.Member,
  // the message that set it off, so an edit to it doesn't warn them again
  messageId?: string,
  // what they did, in the server's language (it's the warning's reason)
  reason: string,
  rule: RestResponsesRaw.GuildWarningAuto,
}

export interface AutoWarnResult {
  counts: RestResponsesRaw.GuildWarningCounts,
  // the ladder step the warning reached, and if it went through (the bot can be missing the permission for it)
  step: RestResponsesRaw.GuildWarningAction | null,
  stepDone: boolean,
  warning: RestResponsesRaw.GuildWarning,
}

/**
 * Warns the member for setting off `rule`, with the bot as the moderator: the warning (counting as the rule's
 * `warnings`), the moderation log, a dm like `warn`'s, then the ladder step it reached if the bot can do it. Null if
 * they weren't warned (on cooldown, an edit of a message they were already warned for, at the most warnings a member
 * can have, or the api failing). The caller tells them where it happened.
 */
export async function runAutoWarn(
  context: Command.Context | Interaction.InteractionContext,
  options: AutoWarnOptions,
): Promise<AutoWarnResult | null> {
  const { member, rule } = options;
  const guild = context.guild;
  const moderator = context.client.user;
  if (!guild || !moderator || member.bot) {
    return null;
  }

  const key = `${guild.id}.${member.id}.${rule.trigger}`;
  if (cooldowns.has(key) || (options.messageId && warnedMessages.has(options.messageId))) {
    return null;
  }
  cooldowns.set(key, Date.now());
  if (options.messageId) {
    warnedMessages.set(options.messageId, true);
  }

  let response: RestResponsesRaw.PutGuildWarnings;
  try {
    response = await putGuildWarnings(context, guild.id, {
      moderatorId: moderator.id,
      reason: options.reason,
      userIds: [member.id],
      weight: rule.warnings,
    });
  } catch(error) {
    // already at the most warnings a member can have, or the api is down, nothing to tell anyone
    return null;
  }
  const warning = response.warnings[0];
  if (!warning) {
    return null;
  }
  const counts = response.counts[member.id] || {active: rule.warnings, total: rule.warnings};
  const step = (response.actions || {})[member.id] || null;

  GuildLoggingStore.logModeration(context.client, {
    guildId: guild.id,
    happened: Date.now(),
    name: GuildLoggingCustomEvents.GUILD_WARNING_ADD,
    payload: {counts, moderator, user: member.user, warning},
  });

  const audit = await getGuildTranslator(context);
  // before the step, a kick or ban would stop them getting it
  try {
    const dm = await getTranslatorForUser(context, member.id);
    const details = [
      dm.translate('moderation_mute.moderator', {user: formatUserTag(moderator), user2: moderator.id}),
      dm.translate('moderation_mute.date', {timestamp: createTimestampMomentFromGuild(Date.now(), guild.id).format(DateMomentLogFormat)}),
      dm.translate('moderation_mute.reason', {text: options.reason}),
    ].join('\n');
    await member.createMessage([
      dm.translate('moderation_autowarn.you_have_been_warned_in', {guild: guild.id, name: Markup.escape.all(guild.name)}),
      '',
      dm.translate('moderation_mute.details', {reason: Markup.codeblock(details)}),
      displayDetailsLine([
        (1 < rule.warnings) && formatWarningWeight(dm, rule.warnings),
        formatCounts(dm, counts),
      ]),
      (step) ? displayDetailsLine([
        dm.translate('moderation_warn.auto_reached', {count: step.threshold.toLocaleString(dm.language)}),
        formatWarningAction(dm, step),
      ]) : '',
    ].join('\n').trim());
  } catch(error) {
    // they have dms closed
  }

  const stepDone = (step) ? await runWarningStep(context, member, step, audit, options.reason) : false;
  return {counts, step, stepDone, warning};
}


// a ladder step done by the bot itself, skipped (false) when it can't
async function runWarningStep(
  context: Command.Context | Interaction.InteractionContext,
  member: Structures.Member,
  step: RestResponsesRaw.GuildWarningAction,
  audit: Translator,
  reason: string,
): Promise<boolean> {
  const me = context.me;
  const guildId = member.guildId;
  if (!me || !me.canEdit(member) || getWarningActionPermissions(step).some((permission) => !me.can(permission))) {
    return false;
  }
  // discord doesn't let anyone time out an administrator (or the owner)
  if (step.action === 'mute' && (member.isOwner || member.canAdministrator)) {
    return false;
  }
  const auditReason = [
    audit.translate('moderation_mute.moderator', {user: formatUserTag(me.user), user2: me.id}),
    audit.translate('moderation_mute.reason', {
      text: `${audit.translate('moderation_warn.auto_reached', {count: step.threshold.toLocaleString(audit.language)})}: ${reason}`,
    }),
  ].join('\n').slice(0, 512);

  try {
    switch (step.action) {
      case 'ban': {
        if (step.duration) {
          await putGuildTimedBans(context, guildId, {moderatorId: me.id, timestampEnd: Date.now() + step.duration * 1000, userIds: [member.id]});
        } else {
          // a permanent ban replaces an earlier timed one
          await deleteGuildTimedBans(context, guildId, {userIds: [member.id]}).catch(() => null);
        }
        await context.rest.createGuildBan(guildId, member.id, {deleteMessageSeconds: step.clean, reason: auditReason});
      }; break;
      case 'kick': {
        if (step.clean) {
          // kicking with their messages deleted is a ban and unban
          await context.rest.createGuildBan(guildId, member.id, {deleteMessageSeconds: step.clean, reason: auditReason});
          await member.removeBan({reason: auditReason});
        } else {
          await member.remove({reason: auditReason});
        }
      }; break;
      case 'mute': {
        await member.edit({communicationDisabledUntil: new Date(Date.now() + (step.duration || 0) * 1000), reason: auditReason});
      }; break;
    }
  } catch(error) {
    return false;
  }
  return true;
}


// "⚠️ @member was warned automatically: <reason>" (or "you were" when only they see it) and the counts (and the step it
// reached) under it
export function formatAutoWarnNotice(
  translator: Translator,
  member: Structures.Member,
  rule: RestResponsesRaw.GuildWarningAuto,
  result: AutoWarnResult,
  reason: string,
  toThem: boolean = false,
): string {
  const { language, translate } = translator;
  const { counts, step, stepDone } = result;
  return [
    `${StatusEmojis.WARNING} ${(toThem) ? translate('moderation_autowarn.notice_you', {reason}) : translate('moderation_autowarn.notice', {reason, user: member.mention})}`,
    displayDetailsLine([
      (1 < rule.warnings) && formatWarningWeight(translator, rule.warnings),
      formatCounts(translator, counts),
      (step && stepDone) && `${translate('moderation_warn.auto_reached', {count: step.threshold.toLocaleString(language)})}: ${formatWarningAction(translator, step)}`,
    ], true),
  ].join('\n');
}


// the reason a rule's warning gets, in a given language
export function createAutoWarnReason(
  translator: Translator,
  rule: RestResponsesRaw.GuildWarningAuto,
  details: {command?: string, mentions?: number},
): string {
  const { language, translate } = translator;
  switch (rule.trigger) {
    case GuildWarningAutoTriggers.BLOCKED_COMMAND: {
      return translate('moderation_autowarn.reason_blocked_command', {command: details.command || '?'});
    };
    case GuildWarningAutoTriggers.MENTIONS: {
      return translate('moderation_autowarn.reason_mentions', {
        count: (details.mentions || 0).toLocaleString(language),
        limit: (rule.limit || 0).toLocaleString(language),
      });
    };
  }
  return rule.trigger;
}
