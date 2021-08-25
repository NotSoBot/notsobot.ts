import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editUser } from '../../../api';
import {
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
import { editOrReply } from '../..';


export interface CommandArgs {
  locale?: GoogleLocales | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const user = await editUser(context, context.userId, {locale: args.locale});

  let text: string;
  if (user.locale) {
    let languageText: string = user.locale;
    if (languageText in GoogleLocalesText) {
      languageText = GoogleLocalesText[user.locale];
    }
    text = `Ok, set your default language preference to ${Markup.bold(languageText)}`;
  } else {
    text = 'Ok, cleared out your default language preference';
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
