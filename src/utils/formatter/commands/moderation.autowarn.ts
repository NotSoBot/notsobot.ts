import { Collections, Command, Interaction, ShardClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildTimedBans, editGuildSettings, putGuildTimedBans, putGuildWarnings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { RestResponsesRaw } from '../../../api/types';
import GuildLoggingListener from '../../../listeners/guildlogging';
import GuildSettingsStore from '../../../stores/guildsettings';
import {
  DateMomentLogFormat,
  EmbedColors,
  GuildWarningAutoTriggers,
  MAX_GUILD_WARNING_WEIGHT,
  MAX_GUILD_WARNINGS_AUTO,
  MAX_GUILD_WARNINGS_AUTO_EXEMPT_ROLES,
  MAX_GUILD_WARNINGS_AUTO_MENTIONS,
  PermissionsText,
  StatusEmojis,
} from '../../../constants';
import { LanguageContext, Translator, getCachedTranslator, getGuildTranslator, getTranslator, getTranslatorForUser } from '../../i18n';
import { Parameters, createTimestampMomentFromGuild, displayDetailsLine, displayReply, formatUserTag } from '../../../utils';

import { GuildLoggingCustomEvents } from '../loggers';

import { formatCounts, formatWarningAction, getWarningActionPermissions } from './moderation.warn';


export const COMMAND_ID = 'server.autowarn.list';
// the commands changing them, through `createSetMessage`
export const COMMAND_ID_AUTOMOD = 'server.autowarn.automod';
export const COMMAND_ID_BLOCKED = 'server.autowarn.blocked';
export const COMMAND_ID_EXEMPT = 'server.autowarn.exempt';
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
// category), then its parent's parent, then the server-wide one. For AutoMod, the rules for that AutoMod rule or for any
// of them, the AutoMod rule's own goes first wherever they're both set
export function resolveGuildWarningAuto(
  settings: GuildSettings,
  trigger: GuildWarningAutoTriggers,
  channel: Structures.Channel | null,
  channelId: string | null,
  automodRuleId: string | null = null,
): RestResponsesRaw.GuildWarningAuto | null {
  const rules = ((settings.settings) ? settings.settings.warningsAuto : []).filter((rule) => {
    return rule.trigger === trigger && (!rule.automod_rule_id || rule.automod_rule_id === automodRuleId);
  });
  if (!rules.length) {
    return null;
  }
  const find = (id: string | null) => {
    const matching = rules.filter((rule) => (rule.channel_id || null) === id);
    return matching.find((rule) => !!rule.automod_rule_id) || matching[0] || null;
  };
  const parent = (channel) ? channel.parent : null;
  for (let id of [channelId, channel && channel.parentId, parent && parent.parentId]) {
    const rule = (id) ? find(id) : null;
    if (rule) {
      return rule;
    }
  }
  return find(null);
}


// a server's discord AutoMod rules by id -> name, for showing which one a rule is for (empty if they can't be fetched,
// it needs manage server)
export async function fetchAutomodRuleNames(
  context: {guildId?: string | null, rest: ShardClient['rest']},
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (!context.guildId) {
    return names;
  }
  try {
    const rules = await context.rest.fetchGuildAutoModerationRules(context.guildId);
    for (let [ruleId, rule] of rules) {
      names.set(ruleId, rule.name);
    }
  } catch(error) {
    // no manage server
  }
  return names;
}

export interface AutomodRuleChoice {
  id: string,
  name: string,
}

// what `-rule` takes: one of the server's AutoMod rules by name or id
export async function automodRuleParser(
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Promise<AutomodRuleChoice | undefined> {
  const text = value.trim();
  if (!text) {
    return undefined;
  }
  const names = await fetchAutomodRuleNames(context);
  if (names.has(text)) {
    return {id: text, name: names.get(text)!};
  }
  for (let [id, name] of names) {
    if (name.toLowerCase() === text.toLowerCase()) {
      return {id, name};
    }
  }
  throw new Error(getCachedTranslator(context).translate('moderation_autowarn.unknown_automod_rule', {rule: Markup.codestring(text.slice(0, 100))}));
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


// if the member has any of the exemption's roles or any of its permissions (server-wide, not a channel's overwrites)
export function matchesGuildWarningAutoExempt(
  member: Structures.Member,
  exempt: RestResponsesRaw.GuildWarningAutoExempt | null | undefined,
): boolean {
  if (!exempt) {
    return false;
  }
  if (exempt.role_ids.some((roleId) => member.roles.has(roleId))) {
    return true;
  }
  const permissions = BigInt(exempt.permissions || '0');
  return !!permissions && (member.permissions & permissions) !== 0n;
}

// if auto-warn skips them for this rule, the server's exemption or the rule's own
export function isGuildWarningAutoExempt(
  settings: GuildSettings,
  rule: RestResponsesRaw.GuildWarningAuto,
  member: Structures.Member,
): boolean {
  const serverExempt = (settings.settings) ? settings.settings.warningsAutoExempt : null;
  return matchesGuildWarningAutoExempt(member, serverExempt) || matchesGuildWarningAutoExempt(member, rule.exempt);
}


// what `-exempt-permissions` takes: english names like `manage messages` or `MANAGE_MESSAGES`, separated by commas
const PERMISSION_NAMES: Record<string, bigint> = (() => {
  const names: Record<string, bigint> = {};
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '');
  for (let [key, value] of Object.entries(Permissions)) {
    if (typeof(value) === 'bigint' && value) {
      names[normalize(key)] = value;
      const label = PermissionsText[String(value)];
      if (label) {
        names[normalize(label)] = value;
      }
    }
  }
  return names;
})();

// the values for clearing an exemption's roles or permissions
export const NONE_VALUES = ['none', 'off', 'clear', 'nobody'];

export function exemptPermissionsParser(value: string, context: Command.Context | Interaction.InteractionContext): bigint | undefined {
  const text = value.trim();
  if (!text) {
    return undefined;
  }
  if (NONE_VALUES.includes(text.toLowerCase())) {
    return 0n;
  }
  let permissions = 0n;
  const unknown: Array<string> = [];
  for (let part of text.split(/[,\n]+/).map((x) => x.trim()).filter(Boolean)) {
    const permission = PERMISSION_NAMES[part.toLowerCase().replace(/[^a-z]/g, '')];
    if (permission) {
      permissions |= permission;
    } else {
      unknown.push(part);
    }
  }
  if (unknown.length) {
    const { translate } = getCachedTranslator(context);
    throw new Error(translate('moderation_autowarn.unknown_permissions', {permissions: unknown.map((x) => Markup.codestring(x)).join(', ')}));
  }
  return permissions;
}

// roles by mention, id or name, `none` for no roles
export function exemptRolesParser(value: string, context: Command.Context | Interaction.InteractionContext): Array<Structures.Role> | undefined {
  const text = value.trim();
  if (!text) {
    return undefined;
  }
  if (NONE_VALUES.includes(text.toLowerCase())) {
    return [];
  }
  const roles = Parameters.roles(text, context);
  if (!roles.length) {
    throw new Error(getCachedTranslator(context).translate('moderation.items_not_found', {
      items: getCachedTranslator(context).translate('moderation.types.role').toLowerCase(),
    }));
  }
  return roles;
}

// an exemption with the given roles/permissions swapped in (undefined keeps what it had), null once it's empty
export function createGuildWarningAutoExempt(
  current: RestResponsesRaw.GuildWarningAutoExempt | null | undefined,
  roles: Array<Structures.Role> | undefined,
  permissions: bigint | undefined,
): RestResponsesRaw.GuildWarningAutoExempt | null {
  const exempt: RestResponsesRaw.GuildWarningAutoExempt = {
    permissions: (permissions === undefined) ? ((current && current.permissions) || '0') : String(permissions),
    role_ids: (roles === undefined) ? ((current) ? current.role_ids : []) : Array.from(new Set(roles.map((role) => role.id))),
  };
  if (!BigInt(exempt.permissions) && !exempt.role_ids.length) {
    return null;
  }
  return exempt;
}

// "@Mods @Event Hosts • Manage Messages, Mention Everyone"
export function formatGuildWarningAutoExempt(translator: Translator, exempt: RestResponsesRaw.GuildWarningAutoExempt): string {
  const permissions = BigInt(exempt.permissions || '0');
  const names: Array<string> = [];
  for (let [key, label] of Object.entries(PermissionsText)) {
    const bit = BigInt(key);
    if (bit && (permissions & bit) === bit) {
      names.push(translator.label('permissions', label));
    }
  }
  return displayDetailsLine([
    exempt.role_ids.map((roleId) => `<@&${roleId}>`).join(' '),
    names.join(', '),
  ]);
}


// "More than 5 mentions in a message", "Using a blocked command", "Setting off the AutoMod rule **Bad Words**"
export function describeGuildWarningAuto(
  translate: Translator['translate'],
  rule: RestResponsesRaw.GuildWarningAuto,
  automodRuleNames: Map<string, string> = new Map(),
): string {
  switch (rule.trigger) {
    case GuildWarningAutoTriggers.AUTOMOD: {
      if (!rule.automod_rule_id) {
        return translate('moderation_autowarn.trigger_automod_any');
      }
      const name = automodRuleNames.get(rule.automod_rule_id);
      return translate('moderation_autowarn.trigger_automod', {rule: (name) ? `**${Markup.escape.all(name)}**` : Markup.codestring(rule.automod_rule_id)});
    };
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


// "More than 5 mentions in a message • #general • Counts as 2 warnings", and who it skips under it
export function formatGuildWarningAuto(
  translator: Translator,
  rule: RestResponsesRaw.GuildWarningAuto,
  automodRuleNames?: Map<string, string>,
): string {
  const line = displayDetailsLine([
    describeGuildWarningAuto(translator.translate, rule, automodRuleNames),
    (rule.channel_id) ? `<#${rule.channel_id}>` : translator.translate('moderation_autowarn.anywhere'),
    formatWarningWeight(translator, rule.warnings),
  ]);
  if (!rule.exempt) {
    return line;
  }
  return `${line}\n-# ${translator.translate('moderation_autowarn.skips', {exempt: formatGuildWarningAutoExempt(translator, rule.exempt)})}`;
}


export function formatGuildWarningsAuto(
  translator: Translator,
  rules: Array<RestResponsesRaw.GuildWarningAuto>,
  exempt: RestResponsesRaw.GuildWarningAutoExempt | null = null,
  automodRuleNames?: Map<string, string>,
): string {
  const { translate } = translator;
  const exemptLine = (exempt) ? translate('moderation_autowarn.exempt_server', {exempt: formatGuildWarningAutoExempt(translator, exempt)}) : null;
  if (!rules.length) {
    return [translate('moderation_autowarn.none'), exemptLine && `-# ${exemptLine}`].filter(Boolean).join('\n');
  }
  return [
    translate('moderation_autowarn.rules'),
    ...rules.map((rule) => `-> ${formatGuildWarningAuto(translator, rule, automodRuleNames)}`),
    '',
    exemptLine || translate('moderation_autowarn.exempt_server_none'),
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
    description: formatGuildWarningsAuto(
      translator,
      settings.settings.warningsAuto || [],
      settings.settings.warningsAutoExempt,
      await fetchNamesIfNeeded(context, settings.settings.warningsAuto || []),
    ),
    ephemeral: true,
  });
}


// only asks discord when there's an AutoMod rule to name
async function fetchNamesIfNeeded(
  context: Command.Context | Interaction.InteractionContext,
  rules: Array<RestResponsesRaw.GuildWarningAuto>,
): Promise<Map<string, string>> {
  return (rules.some((rule) => !!rule.automod_rule_id)) ? fetchAutomodRuleNames(context) : new Map();
}


// what `autowarn remove` takes for each trigger
export const TRIGGER_VALUES: Record<string, GuildWarningAutoTriggers> = Object.freeze({
  'auto-mod': GuildWarningAutoTriggers.AUTOMOD,
  automod: GuildWarningAutoTriggers.AUTOMOD,
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
  // automod: the AutoMod rule, any of them without it
  automodRule?: AutomodRuleChoice,
  // null: anywhere
  channel: Structures.Channel | null,
  // who the rule skips (on top of the server's), undefined keeps what an existing rule had and empty clears it
  exemptPermissions?: bigint,
  exemptRoles?: Array<Structures.Role>,
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
  const automodRuleId = (args.trigger === GuildWarningAutoTriggers.AUTOMOD && args.automodRule) ? args.automodRule.id : null;
  const isSame = (rule: RestResponsesRaw.GuildWarningAuto) => {
    return rule.trigger === args.trigger && rule.channel_id === channelId && (rule.automod_rule_id || null) === automodRuleId;
  };
  const rules = settings.settings.warningsAuto || [];
  const others = rules.filter((rule) => !isSame(rule));

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
    if (args.exemptRoles && MAX_GUILD_WARNINGS_AUTO_EXEMPT_ROLES < args.exemptRoles.length) {
      return reply(translate('moderation_autowarn.too_many_roles', {max: MAX_GUILD_WARNINGS_AUTO_EXEMPT_ROLES.toLocaleString(language)}));
    }
    // changing a rule keeps who it skipped unless that's given too
    const existing = rules.find(isSame);
    const exempt = createGuildWarningAutoExempt(existing && existing.exempt, args.exemptRoles, args.exemptPermissions);
    rule = {automod_rule_id: automodRuleId, channel_id: channelId, exempt, limit, trigger: args.trigger, warnings};
  }

  const { settings: updated } = await editGuildSettings(context, context.guildId!, {
    warningsAuto: (rule) ? [...others, rule] : others,
  });
  const names = await fetchNamesIfNeeded(context, [...(updated.warningsAuto || []), ...rules]);
  const description = [
    translate((rule) ? 'moderation_autowarn.added' : 'moderation_autowarn.removed', {
      rule: formatGuildWarningAuto(translator, rule || rules.find(isSame)!, names),
    }),
    '',
    formatGuildWarningsAuto(translator, updated.warningsAuto || [], updated.warningsAutoExempt, names),
  ];
  // discord only sends AutoMod's actions to bots with manage server
  if (rule && rule.trigger === GuildWarningAutoTriggers.AUTOMOD && !(context.me && context.me.can(Permissions.MANAGE_GUILD))) {
    description.push(`-# ${translate('moderation_autowarn.automod_needs_manage_guild')}`);
  }
  // blocked commands only come from the server's rules
  if (rule && rule.trigger === GuildWarningAutoTriggers.BLOCKED_COMMAND && !settings.rules.some((x) => !x.allows)) {
    description.push(`-# ${translate('moderation_autowarn.no_block_rules')}`);
  }
  return displayReply(context, {color: EmbedColors.DEFAULT, description: description.join('\n'), ephemeral: true});
}



export interface ExemptArgs {
  // nobody's skipped anymore
  clear?: boolean,
  // undefined keeps what it had, empty clears it
  permissions?: bigint,
  roles?: Array<Structures.Role>,
}

// shows who every auto-warn rule skips, or changes it
export async function createExemptMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: ExemptArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;
  const reply = (text: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${text}`, ephemeral: true});

  const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  if (!settings) {
    return reply(translate('settings_server_set_warnings.error_fetching'));
  }
  if (!args.clear && args.roles === undefined && args.permissions === undefined) {
    return displayReply(context, {
      color: EmbedColors.DEFAULT,
      description: [
        (settings.settings.warningsAutoExempt) ? translate('moderation_autowarn.exempt_server', {
          exempt: formatGuildWarningAutoExempt(translator, settings.settings.warningsAutoExempt),
        }) : translate('moderation_autowarn.exempt_server_none'),
        `-# ${translate('moderation_autowarn.exempt_note')}`,
      ].join('\n'),
      ephemeral: true,
    });
  }
  if (args.roles && MAX_GUILD_WARNINGS_AUTO_EXEMPT_ROLES < args.roles.length) {
    return reply(translate('moderation_autowarn.too_many_roles', {max: MAX_GUILD_WARNINGS_AUTO_EXEMPT_ROLES.toLocaleString(language)}));
  }

  const exempt = (args.clear) ? null : createGuildWarningAutoExempt(settings.settings.warningsAutoExempt, args.roles, args.permissions);
  const { settings: updated } = await editGuildSettings(context, context.guildId!, {warningsAutoExempt: exempt});
  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: [
      translate('moderation_autowarn.exempt_updated'),
      '',
      formatGuildWarningsAuto(translator, updated.warningsAuto || [], updated.warningsAutoExempt, await fetchNamesIfNeeded(context, updated.warningsAuto || [])),
    ].join('\n'),
    ephemeral: true,
  });
}


// what auto-warn needs from where it happened, a command's context or (for AutoMod) the event's shard and guild
export interface AutoWarnContext {
  client: ShardClient,
  guild: Structures.Guild | null,
  guildId?: string,
  me: Structures.Member | null,
  rest: ShardClient['rest'],
}

export interface AutoWarnOptions {
  // on top of the trigger, what the cooldown's for (the AutoMod rule, so different ones each warn)
  cooldownKey?: string,
  member: Structures.Member,
  // the message that set it off, so an edit to it doesn't warn them again
  messageId?: string,
  // what they did, in the server's language (it's the warning's reason)
  reason: string,
  rule: RestResponsesRaw.GuildWarningAuto,
  settings: GuildSettings,
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
 * they weren't warned (exempt, on cooldown, an edit of a message they were already warned for, at the most warnings a
 * member can have, or the api failing). The caller tells them where it happened.
 */
export async function runAutoWarn(
  context: AutoWarnContext,
  options: AutoWarnOptions,
): Promise<AutoWarnResult | null> {
  // the translators only read the client, guild and guild id
  const languageContext = context as unknown as LanguageContext;
  const { member, rule } = options;
  const guild = context.guild;
  const moderator = context.client.user;
  if (!guild || !moderator || member.bot || isGuildWarningAutoExempt(options.settings, rule, member)) {
    return null;
  }

  const key = `${guild.id}.${member.id}.${rule.trigger}.${options.cooldownKey || ''}`;
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

  GuildLoggingListener.logModeration(context.client, {
    guildId: guild.id,
    happened: Date.now(),
    name: GuildLoggingCustomEvents.GUILD_WARNING_ADD,
    payload: {counts, moderator, user: member.user, warning},
  });

  const audit = await getGuildTranslator(languageContext);
  // before the step, a kick or ban would stop them getting it
  try {
    const dm = await getTranslatorForUser(languageContext, member.id);
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
  context: AutoWarnContext,
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


// the reason a rule's warning gets, in a given language, or worded to them for a notice only they see
export function createAutoWarnReason(
  translator: Translator,
  rule: RestResponsesRaw.GuildWarningAuto,
  details: {automodRule?: string, command?: string, mentions?: number},
  toThem: boolean = false,
): string {
  const { language, translate } = translator;
  switch (rule.trigger) {
    case GuildWarningAutoTriggers.AUTOMOD: {
      return translate('moderation_autowarn.reason_automod', {rule: details.automodRule || '?'});
    };
    case GuildWarningAutoTriggers.BLOCKED_COMMAND: {
      const key = (toThem) ? 'moderation_autowarn.reason_blocked_command_you' : 'moderation_autowarn.reason_blocked_command';
      return translate(key, {command: details.command || '?'});
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
