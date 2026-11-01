import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getTranslator } from '../../i18n';

import { editGuildSettings } from '../../../api';
import { displayReply } from '../../../utils';

import { CommandArgs as SettingsSetFontArgs, formatMediaFont } from './settings.set.font';


export const COMMAND_ID = 'server.set.font';

export type CommandArgs = SettingsSetFontArgs;

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
  if (!guildSettings) {
    return displayReply(context, {description: translate('settings_server_set_font.error_fetching'), ephemeral: true});
  }

  let text: string;
  if (args.font || args.clear) {
    const font = (args.clear) ? null : args.font!;
    if ((guildSettings.settings.mediaFont || null) === font) {
      if (font) {
        text = translate('settings_server_set_font.already', {font: formatMediaFont(font)});
      } else {
        text = translate('settings_server_set_font.none');
      }
    } else {
      // read from the response, the store only updates once the api's event comes back
      const { settings } = await editGuildSettings(context, context.guildId!, {mediaFont: font});
      if (settings.mediaFont) {
        text = translate('settings_server_set_font.set', {font: formatMediaFont(settings.mediaFont)});
      } else {
        text = translate('settings_server_set_font.cleared');
      }
    }
  } else if (guildSettings.settings.mediaFont) {
    text = translate('settings_server_set_font.current', {font: formatMediaFont(guildSettings.settings.mediaFont)});
  } else {
    text = translate('settings_server_set_font.none');
  }

  return displayReply(context, {description: text, ephemeral: true, note: translate('settings_server_set_font.note')});
}
