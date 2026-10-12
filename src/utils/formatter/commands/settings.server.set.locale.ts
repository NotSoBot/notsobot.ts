import { Command, Interaction } from 'detritus-client';
import { Locales as DiscordLocales, LocalesText } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';
import UserSettingsStore from '../../../stores/usersettings';
import { getTranslatorForLanguage, languageFromLocale, Languages } from '../../i18n';


export const COMMAND_ID = 'settings.server.set.locale';

export interface CommandArgs {
  locale: DiscordLocales,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const guild = context.guild;
  if (guild) {
    await guild.edit({preferredLocale: args.locale});

    // same order as `resolveLanguage`, but with the new guild locale since the cached guild won't have it yet
    const settings = await UserSettingsStore.getOrFetch(context, context.userId);
    const language = (
      languageFromLocale(settings && settings.locale) ||
      languageFromLocale((context instanceof Command.Context) ? null : context.locale) ||
      languageFromLocale(args.locale) ||
      Languages.ENGLISH
    );
    const { translate } = getTranslatorForLanguage(language);

    let text: string = args.locale;
    if (args.locale in LocalesText) {
      text = LocalesText[args.locale];
    }
    return editOrReply(context, translate('settings_server_set_locale.successfully_changed_the_guild_s_locale_to', {text: text}));
  }
}
