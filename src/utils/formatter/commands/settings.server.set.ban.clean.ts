import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { editGuildSettings } from '../../../api';
import { GuildSettingsChild } from '../../../api/structures/guildsettings';
import { BAN_CLEAN_MAX, StatusEmojis } from '../../../constants';
import { Translator, getTranslator } from '../../i18n';
import { Parameters, displayReply, formatDuration } from '../../../utils';


export const COMMAND_ID = 'server.set.ban.clean';

export interface CommandArgs {
  // seconds of messages `ban` deletes when the moderator doesn't pick
  clean?: number,
}

// a duration, or none/0 for bans that delete nothing
export function cleanParser(value: string, context: Command.Context | Interaction.InteractionContext): number | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (['none', 'off', 'never', '0'].includes(text)) {
    return 0;
  }
  return Parameters.secondsWithOptions({float: false})(text, context);
}

export function formatBanClean(translator: Translator, settings: GuildSettingsChild): string {
  const { language, translate } = translator;
  if (settings.banClean) {
    return translate('settings_server_moderation.ban_clean', {duration: formatDuration(settings.banClean * 1000, language)});
  }
  return translate('settings_server_moderation.ban_clean_none');
}

// shows it with nothing given, otherwise changes it
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;

  if (args.clean === undefined || args.clean === null) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (!guildSettings) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.error_fetching')}`, ephemeral: true});
    }
    const text = [translate('settings_server_moderation.current'), `-> ${formatBanClean(translator, guildSettings.settings)}`].join('\n');
    return displayReply(context, {description: text, ephemeral: true});
  }

  if (args.clean < 0 || BAN_CLEAN_MAX < args.clean) {
    return displayReply(context, {
      description: `${StatusEmojis.WARNING} ${translate('settings_server_moderation.invalid_clean', {max: formatDuration(BAN_CLEAN_MAX * 1000, language)})}`,
      ephemeral: true,
    });
  }
  const { settings } = await editGuildSettings(context, context.guildId!, {banClean: args.clean});
  const text = [translate('settings_server_moderation.updated'), `-> ${formatBanClean(translator, settings)}`].join('\n');
  return displayReply(context, {description: text, ephemeral: true});
}
