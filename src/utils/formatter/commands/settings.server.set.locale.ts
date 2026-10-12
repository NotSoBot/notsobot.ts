import { Command, Interaction } from 'detritus-client';
import { Locales as DiscordLocales, LocalesText } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'settings.server.set.locale';

export interface CommandArgs {
  locale: DiscordLocales,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const guild = context.guild;
  if (guild) {
    await guild.edit({preferredLocale: args.locale});

    let text: string = args.locale;
    if (args.locale in LocalesText) {
      text = LocalesText[args.locale];
    }
    return editOrReply(context, translate('settings_server_set_locale.successfully_changed_the_guild_s_locale_to', {text: text}));
  }
}
