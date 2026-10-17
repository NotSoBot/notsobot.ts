import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { GuildSettings, GuildSettingsListItem } from '../../../api/structures/guildsettings';
import {
  EmbedColors,
  GuildAdminBypassLists,
  GuildAdminBypassValues,
  GuildCommandsAllowlistTypes,
  StatusEmojis,
} from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { DisplayPayload, displayReply } from '../../../utils';
import { Translator, getTranslator } from '../../i18n';


// same prefixes as each list's other commands, `isGuildListCommandId` relies on it
export const ALLOWLIST_COMMAND_ID = 'server.allowlist.admin.bypass';
export const BLOCKLIST_COMMAND_ID = 'server.blocklist.admin.bypass';
export const COMMANDS_ALLOWLIST_COMMAND_ID = 'server.commands.allowlist.admin.bypass';
export const COMMANDS_BLOCKLIST_COMMAND_ID = 'server.commands.blocklist.admin.bypass';

// for `Parameters.Slash.oneOf`, in this order
export const VALUE_CHOICES = Object.freeze({
  choices: {
    ENABLED: GuildAdminBypassValues.ENABLED,
    DISABLED: GuildAdminBypassValues.DISABLED,
    DEFAULT: GuildAdminBypassValues.DEFAULT,
  },
  descriptions: {
    [GuildAdminBypassValues.DEFAULT]: 'Default',
    [GuildAdminBypassValues.DISABLED]: 'Off',
    [GuildAdminBypassValues.ENABLED]: 'On',
  },
  doNotSort: true,
  localizationKey: 'choices.guild_admin_bypass_values',
});

// an entry on any of the lists, `command` only for the command lists
export interface AdminBypassTarget {
  command?: string,
  id: string,
  type: string,
}

export interface CommandArgs {
  // null changes the server's setting for the list
  targets: Array<AdminBypassTarget> | null,
  value: GuildAdminBypassValues,
}


const SettingsKeys = Object.freeze({
  [GuildAdminBypassLists.ALLOWLIST]: 'allowlistAdminBypass',
  [GuildAdminBypassLists.BLOCKLIST]: 'blocklistAdminBypass',
  [GuildAdminBypassLists.COMMANDS_ALLOWLIST]: 'commandsAllowlistAdminBypass',
  [GuildAdminBypassLists.COMMANDS_BLOCKLIST]: 'commandsBlocklistAdminBypass',
} as const);


function getTargetKey(target: AdminBypassTarget): string {
  return (target.command) ? `${target.command}.${target.id}.${target.type}` : `${target.id}.${target.type}`;
}

function getList(settings: GuildSettings, list: GuildAdminBypassLists): Array<GuildSettingsListItem> {
  switch (list) {
    case GuildAdminBypassLists.ALLOWLIST: return settings.allowlist.toArray();
    case GuildAdminBypassLists.BLOCKLIST: return settings.blocklist.toArray();
    case GuildAdminBypassLists.COMMANDS_ALLOWLIST: return settings.commandsAllowlist.toArray();
    case GuildAdminBypassLists.COMMANDS_BLOCKLIST: return settings.commandsBlocklist.toArray();
  }
}

export function getListName(translate: Translator['translate'], list: GuildAdminBypassLists): string {
  switch (list) {
    case GuildAdminBypassLists.ALLOWLIST: return translate('moderation.admin_bypass.lists.allowlist');
    case GuildAdminBypassLists.BLOCKLIST: return translate('moderation.admin_bypass.lists.blocklist');
    case GuildAdminBypassLists.COMMANDS_ALLOWLIST: return translate('moderation.admin_bypass.lists.commands_allowlist');
    case GuildAdminBypassLists.COMMANDS_BLOCKLIST: return translate('moderation.admin_bypass.lists.commands_blocklist');
  }
}

export function getValueText(translate: Translator['translate'], value: boolean): string {
  return translate((value) ? 'moderation.admin_bypass.on' : 'moderation.admin_bypass.off');
}

export function getServerSetting(settings: GuildSettings | null | undefined, list: GuildAdminBypassLists): boolean {
  if (settings && settings.settings) {
    return settings.settings[SettingsKeys[list]];
  }
  return true;
}

// the line the list embeds show at the top, only when the server turned the bypass off for the list
export function getListLine(
  translate: Translator['translate'],
  settings: GuildSettings | null | undefined,
  list: GuildAdminBypassLists,
): string | null {
  if (getServerSetting(settings, list)) {
    return null;
  }
  return translate('moderation.admin_bypass.list_line', {value: getValueText(translate, false)});
}

// the line the list embeds show under an entry, only when it has its own setting
export function getEntryLine(translate: Translator['translate'], item: GuildSettingsListItem): string | null {
  if (typeof(item.adminBypass) !== 'boolean') {
    return null;
  }
  return translate('moderation.admin_bypass.entry_line', {value: getValueText(translate, item.adminBypass)});
}

function describeTarget(
  context: Command.Context | Interaction.InteractionContext,
  translate: Translator['translate'],
  target: AdminBypassTarget,
): string {
  let description: string;
  switch (target.type) {
    case GuildCommandsAllowlistTypes.CHANNEL: description = `<#${target.id}>`; break;
    case GuildCommandsAllowlistTypes.GUILD: description = translate('moderation.admin_bypass.server_wide'); break;
    case GuildCommandsAllowlistTypes.ROLE: description = (target.id === context.guildId) ? '@everyone' : `<@&${target.id}>`; break;
    case GuildCommandsAllowlistTypes.USER: description = `<@${target.id}>`; break;
    default: description = target.id;
  }
  if (target.command) {
    description = `${Markup.codestring(target.command)} ${description}`;
  }
  return description;
}

// targets for the entries of a command, server-wide when no channels/roles/users are given (same as `add`)
export function getCommandTargets(
  context: Command.Context | Interaction.InteractionContext,
  args: {
    channels?: Array<Structures.Channel> | null,
    command: Command.Command,
    roles?: Array<Structures.Role> | null,
    users?: Array<Structures.Member | Structures.User> | null,
  },
): Array<AdminBypassTarget> {
  const { command } = args;
  const commandId = (command.metadata && command.metadata.id) ? command.metadata.id : command.name.split(' ').join('.');

  const targets: Array<AdminBypassTarget> = [];
  for (let channel of args.channels || []) {
    targets.push({command: commandId, id: channel.id, type: GuildCommandsAllowlistTypes.CHANNEL});
  }
  for (let role of args.roles || []) {
    targets.push({command: commandId, id: role.id, type: GuildCommandsAllowlistTypes.ROLE});
  }
  for (let user of args.users || []) {
    targets.push({command: commandId, id: user.id, type: GuildCommandsAllowlistTypes.USER});
  }
  if (!targets.length) {
    targets.push({command: commandId, id: context.guildId!, type: GuildCommandsAllowlistTypes.GUILD});
  }
  return targets;
}


const ValueAliases: Record<string, GuildAdminBypassValues> = Object.freeze({
  default: GuildAdminBypassValues.DEFAULT,
  disable: GuildAdminBypassValues.DISABLED,
  disabled: GuildAdminBypassValues.DISABLED,
  enable: GuildAdminBypassValues.ENABLED,
  enabled: GuildAdminBypassValues.ENABLED,
  false: GuildAdminBypassValues.DISABLED,
  no: GuildAdminBypassValues.DISABLED,
  off: GuildAdminBypassValues.DISABLED,
  on: GuildAdminBypassValues.ENABLED,
  reset: GuildAdminBypassValues.DEFAULT,
  true: GuildAdminBypassValues.ENABLED,
  yes: GuildAdminBypassValues.ENABLED,
});

// for the prefixed commands, `<on|off|default> ...rest`
export function parseValueText(text: string): {rest: string, value: GuildAdminBypassValues | null} {
  const [ first, ...rest ] = (text || '').trim().split(/\s+/);
  const value = ValueAliases[(first || '').toLowerCase()] || null;
  return {rest: rest.join(' '), value};
}

export interface CommandListArgs {
  channels?: Array<Structures.Channel> | null,
  command?: Command.Command | null,
  roles?: Array<Structures.Role> | null,
  users?: Array<Structures.Member | Structures.User> | null,
}

// for the command lists, entries need a command (no command changes the server's setting, so no channels/roles/users)
export function isValidCommandArgs(args: CommandListArgs): boolean {
  if (args.command === null) {
    return false;
  }
  if ((args.channels && !args.channels.length) || (args.roles && !args.roles.length) || (args.users && !args.users.length)) {
    return false;
  }
  if (!args.command && (args.channels || args.roles || args.users)) {
    return false;
  }
  return true;
}

export async function getInvalidCommandArgsText(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandListArgs,
): Promise<string> {
  const { translate } = await getTranslator(context);
  if (args.command === null) {
    return translate('errors.unknown_command');
  }
  const errors: Array<string> = [];
  if (args.channels && !args.channels.length) {
    errors.push(translate('moderation.types.channel').toLowerCase());
  }
  if (args.roles && !args.roles.length) {
    errors.push(translate('moderation.types.role').toLowerCase());
  }
  if (args.users && !args.users.length) {
    errors.push(translate('moderation.types.user').toLowerCase());
  }
  if (errors.length) {
    return translate('moderation.items_not_found', {items: errors.join(', ')});
  }
  return translate('moderation.admin_bypass.needs_command');
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  list: GuildAdminBypassLists,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;

  const listName = getListName(translate, list);
  let settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.title = translate('moderation.admin_bypass.title');

  if (!args.targets) {
    // default turns it back on, the api resets it on null
    const value = (args.value === GuildAdminBypassValues.DEFAULT) ? null : (args.value === GuildAdminBypassValues.ENABLED);
    settings = await editGuildSettings(context, guildId, {[SettingsKeys[list]]: value});

    const description = [
      translate('moderation.admin_bypass.server_set', {list: listName, value: getValueText(translate, getServerSetting(settings, list))}),
    ];
    const overrides = getList(settings, list).filter((item) => typeof(item.adminBypass) === 'boolean');
    if (overrides.length) {
      description.push(translate('moderation.admin_bypass.overrides', {count: overrides.length.toLocaleString()}));
    }
    payload.description = description.join('\n');
    return displayReply(context, payload);
  }

  // null makes the entries follow the server's setting again
  const value = (args.value === GuildAdminBypassValues.DEFAULT) ? null : (args.value === GuildAdminBypassValues.ENABLED);

  const targetKeys = new Set(args.targets.map(getTargetKey));
  const items = getList(settings, list);

  const found: Array<AdminBypassTarget> = [];
  const entries = items.map((item) => {
    const target: AdminBypassTarget = {id: item.id, type: item.type};
    if ('command' in item) {
      target.command = item.command;
    }
    // only the targeted entries get `admin_bypass`, the api leaves the others' alone
    const entry: AdminBypassTarget & {admin_bypass?: boolean | null} = {...target};
    if (targetKeys.has(getTargetKey(target))) {
      entry.admin_bypass = value;
      found.push(target);
    }
    return entry;
  });

  const foundKeys = new Set(found.map(getTargetKey));
  const missing = args.targets.filter((target) => !foundKeys.has(getTargetKey(target)));

  const description: Array<string> = [];
  if (found.length) {
    switch (list) {
      case GuildAdminBypassLists.ALLOWLIST: settings = await editGuildSettings(context, guildId, {allowlist: entries}); break;
      case GuildAdminBypassLists.BLOCKLIST: settings = await editGuildSettings(context, guildId, {blocklist: entries}); break;
      case GuildAdminBypassLists.COMMANDS_ALLOWLIST: settings = await editGuildSettings(context, guildId, {commandsAllowlist: entries as Array<Required<AdminBypassTarget>>}); break;
      case GuildAdminBypassLists.COMMANDS_BLOCKLIST: settings = await editGuildSettings(context, guildId, {commandsBlocklist: entries as Array<Required<AdminBypassTarget>>}); break;
    }

    const valueText = (value === null)
      ? translate('moderation.admin_bypass.default', {value: getValueText(translate, getServerSetting(settings, list))})
      : getValueText(translate, value);
    description.push(translate('moderation.admin_bypass.entries_set', {list: listName, value: valueText}));
    for (let target of found) {
      description.push(`-> ${describeTarget(context, translate, target)}`);
    }
  }
  if (missing.length) {
    if (description.length) {
      description.push('');
    }
    description.push(`${StatusEmojis.WARNING} ${translate('moderation.admin_bypass.not_found', {list: listName})}`);
    for (let target of missing) {
      description.push(`-> ${describeTarget(context, translate, target)}`);
    }
  }
  payload.description = description.join('\n');
  return displayReply(context, payload);
}
