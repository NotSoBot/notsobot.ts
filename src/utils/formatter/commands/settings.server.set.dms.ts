import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { editGuildSettings } from '../../../api';
import { GuildSettingsChild } from '../../../api/structures/guildsettings';
import { GUILD_MODERATION_DM_ALL, GuildModerationDmFlags, StatusEmojis } from '../../../constants';
import { TranslationKey, Translator, getCachedTranslator, getTranslator } from '../../i18n';
import { displayDetailsLine, displayReply } from '../../../utils';


export const COMMAND_ID = 'server.set.dms';

// what `-dm` takes, english like the other flags
export const DM_ON_VALUES = ['on', 'true', 'yes', 'enable', '1'];
export const DM_OFF_VALUES = ['off', 'false', 'no', 'disable', '0'];

// the kinds of moderation dms in the order they're shown, with what `-for` takes for each
export const DM_KINDS: Array<{flag: GuildModerationDmFlags, key: TranslationKey, value: string, values: Array<string>}> = [
  {flag: GuildModerationDmFlags.BAN, key: 'settings_server_moderation.kind_ban', value: 'ban', values: ['ban', 'bans']},
  {flag: GuildModerationDmFlags.KICK, key: 'settings_server_moderation.kind_kick', value: 'kick', values: ['kick', 'kicks']},
  {flag: GuildModerationDmFlags.MUTE, key: 'settings_server_moderation.kind_mute', value: 'mute', values: ['mute', 'mutes', 'timeout']},
  {flag: GuildModerationDmFlags.WARN, key: 'settings_server_moderation.kind_warn', value: 'warn', values: ['warn', 'warns', 'warning', 'warnings']},
  {flag: GuildModerationDmFlags.AUTOWARN, key: 'settings_server_moderation.kind_autowarn', value: 'autowarn', values: ['autowarn', 'autowarns', 'auto-warn']},
];

export interface CommandArgs {
  // turns the dms (all of them, or just `for`'s) on or off
  dm?: boolean,
  for?: GuildModerationDmFlags,
}

export function dmParser(value: string, context: Command.Context | Interaction.InteractionContext): boolean | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (DM_ON_VALUES.includes(text)) {
    return true;
  }
  if (DM_OFF_VALUES.includes(text)) {
    return false;
  }
  throw new Error(getCachedTranslator(context).translate('settings_server_moderation.invalid_dm'));
}

export function forParser(value: string, context: Command.Context | Interaction.InteractionContext): GuildModerationDmFlags | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  const kind = DM_KINDS.find((kind) => kind.values.includes(text));
  if (kind) {
    return kind.flag;
  }
  throw new Error(getCachedTranslator(context).translate('settings_server_moderation.invalid_dm_for'));
}

// the slash command's `for` choices are the kind's value
export function forSlashParser(value: string): GuildModerationDmFlags | undefined {
  const kind = DM_KINDS.find((kind) => kind.value === value);
  return (kind) ? kind.flag : undefined;
}

export function formatDms(translator: Translator, settings: GuildSettingsChild): string {
  const { translate } = translator;
  const enabled = DM_KINDS.filter((kind) => (settings.moderationDmDisabled & kind.flag) !== kind.flag);
  if (enabled.length) {
    return translate('settings_server_moderation.dms', {kinds: displayDetailsLine(enabled.map((kind) => translate(kind.key)))});
  }
  return translate('settings_server_moderation.dms_none');
}

// shows them with nothing given, otherwise turns all of them (or `for`'s) on or off
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;

  const changing = args.dm !== undefined && args.dm !== null;
  if (args.for && !changing) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_moderation.dm_for_without_dm')}`, ephemeral: true});
  }

  // one kind flips on top of what's there, so that needs the current flags too
  const guildSettings = (!changing || args.for) ? await GuildSettingsStore.getOrFetch(context, context.guildId!) : null;
  if ((!changing || args.for) && !guildSettings) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.error_fetching')}`, ephemeral: true});
  }
  if (!changing) {
    const text = [translate('settings_server_moderation.current'), `-> ${formatDms(translator, guildSettings!.settings)}`].join('\n');
    return displayReply(context, {description: text, ephemeral: true});
  }

  const flags = args.for || GUILD_MODERATION_DM_ALL;
  const current = (args.for) ? guildSettings!.settings.moderationDmDisabled : 0;
  const { settings } = await editGuildSettings(context, context.guildId!, {
    moderationDmDisabled: (args.dm) ? (current & ~flags) : (current | flags),
  });
  const text = [translate('settings_server_moderation.updated'), `-> ${formatDms(translator, settings)}`].join('\n');
  return displayReply(context, {description: text, ephemeral: true});
}
