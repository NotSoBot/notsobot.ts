import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings } from '../../../api';
import { GoogleLocales } from '../../../constants';
import { editOrReply, languageCodeToText } from '../../../utils';


export const COMMAND_ID = 'settings.set.locale';

export interface CommandArgs {
  clear?: boolean,
  locale?: GoogleLocales | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);

  let text: string;
  if (args.locale || args.clear) {
    if (args.clear) {
      args.locale = null;
    }
    if (oldSettings && oldSettings.locale === args.locale) {
      if (oldSettings.locale) {
        const languageText = languageCodeToText(oldSettings.locale);
        text = translate('settings_set_locale.your_locale_is_already', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_set_locale.you_currently_do_not_have_a_locale');
      }
    } else {
      // update it
      const settings = await editUserSettings(context, context.userId, {
        locale: args.locale,
      });
      UserSettingsStore.insert(context.userId, settings);

      if (settings.locale) {
        const languageText = languageCodeToText(settings.locale);
        text = translate('settings_set_locale.ok_set_your_locale_preference_to', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_set_locale.ok_cleared_out_your_locale_preference');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.locale) {
        const languageText = languageCodeToText(oldSettings.locale);
        text = translate('settings_set_locale.your_current_locale_is', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_set_locale.you_currently_do_not_have_a_locale');
      }
    } else {
      text = translate('settings_set_locale.error_fetching_your_current_locale');
    }
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
