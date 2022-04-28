import { Command, Interaction } from 'detritus-client';
import { Locales as DiscordLocales, LocalesText } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';


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

    let text: string = args.locale;
    if (args.locale in LocalesText) {
      text = LocalesText[args.locale];
    }
    return editOrReply(context, `Successfully changed the guild\'s locale to ${text}`);
  }
}
