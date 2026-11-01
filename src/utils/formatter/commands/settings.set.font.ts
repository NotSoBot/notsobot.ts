import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { MediaMemeFonts, MediaMemeFontsToText } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.font';

export interface CommandArgs {
  clear?: boolean,
  font?: MediaMemeFonts | null,
}

// a stored name, the api keeps them as `MediaMemeFonts` keys
export function formatMediaFont(font: string): string {
  return Markup.bold(MediaMemeFontsToText[font as MediaMemeFonts] || font);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.font || args.clear) {
    const font = (args.clear) ? null : args.font!;
    if (oldSettings && (oldSettings.media_font || null) === font) {
      if (font) {
        text = translate('settings_set_font.already', {font: formatMediaFont(font)});
      } else {
        text = translate('settings_set_font.none');
      }
    } else {
      const settings = await editUserSettings(context, context.userId, {mediaFont: font});
      UserSettingsStore.insert(context.userId, settings);
      if (settings.media_font) {
        text = translate('settings_set_font.set', {font: formatMediaFont(settings.media_font)});
      } else {
        text = translate('settings_set_font.cleared');
      }
    }
  } else if (oldSettings) {
    if (oldSettings.media_font) {
      text = translate('settings_set_font.current', {font: formatMediaFont(oldSettings.media_font)});
    } else {
      text = translate('settings_set_font.none');
    }
  } else {
    text = translate('settings_set_font.error_fetching');
  }

  return displayReply(context, {description: text, ephemeral: true, note: translate('settings_set_font.note')});
}
