import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';
import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator, getTranslatorForLanguage, resolveLanguage } from '../../i18n';

import { editGuildSettings } from '../../../api';
import { GoogleLocales } from '../../../constants';
import { displayReply, languageCodeToText } from '../../../utils';


export const COMMAND_ID = 'server.set.locale';

export interface CommandArgs {
  clear?: boolean,
  locale?: GoogleLocales | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let { translate } = await getTranslator(context);

  const oldSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);

  let text: string;
  if (args.locale || args.clear) {
    if (args.clear) {
      args.locale = null;
    }
    if (oldSettings && oldSettings.locale === args.locale) {
      if (oldSettings.locale) {
        const languageText = languageCodeToText(oldSettings.locale);
        text = translate('settings_server_set_locale.the_server_s_locale_is_already', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_server_set_locale.the_server_does_not_have_a_locale');
      }
    } else {
      const guildSettings = await editGuildSettings(context, context.guildId!, {
        locale: args.locale,
      });

      // reply in the language the user now gets, their own setting and discord locale still win over the server's
      const settings = await UserSettingsStore.getOrFetch(context, context.userId);
      ({ translate } = getTranslatorForLanguage(resolveLanguage(context, settings, guildSettings)));

      if (guildSettings.locale) {
        const languageText = languageCodeToText(guildSettings.locale);
        text = translate('settings_server_set_locale.ok_set_the_server_s_locale_to', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_server_set_locale.ok_cleared_out_the_server_s_locale');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.locale) {
        const languageText = languageCodeToText(oldSettings.locale);
        text = translate('settings_server_set_locale.the_server_s_current_locale_is', {languageText: Markup.bold(languageText)});
      } else {
        text = translate('settings_server_set_locale.the_server_does_not_have_a_locale');
      }
    } else {
      text = translate('settings_server_set_locale.error_fetching_the_server_s_locale');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
