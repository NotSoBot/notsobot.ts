import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { displayReply, timezoneCodeToText } from '../../../utils';


export const COMMAND_ID = 'settings.set.timezone';

export interface CommandArgs {
  clear?: boolean,
  timezone?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.timezone || args.clear) {
    if (args.clear) {
      args.timezone = null;
    }
    if (oldSettings && oldSettings.timezone === args.timezone) {
      if (oldSettings.timezone) {
        const languageText = timezoneCodeToText(oldSettings.timezone);
        text = translate('settings_set_timezone.your_timezone_is_already', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_set_timezone.you_currently_do_not_have_a_timezone');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        timezone: args.timezone,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.timezone) {
        const languageText = timezoneCodeToText(settings.timezone);
        text = translate('settings_set_timezone.ok_set_your_timezone_preference_to', {languageText: Markup.bold(languageText)});
      } else {
        // this should never happen currently
        text = translate('settings_set_timezone.ok_cleared_out_your_default_timezone_preference');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.timezone) {
        const languageText = timezoneCodeToText(oldSettings.timezone);
        text = translate('settings_set_timezone.your_current_timezone_is', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_set_timezone.you_currently_do_not_have_a_timezone');
      }
    } else {
      text = translate('settings_set_timezone.error_fetching_your_current_timezone');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
