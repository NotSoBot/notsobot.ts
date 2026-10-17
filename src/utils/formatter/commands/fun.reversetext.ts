import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'fun.reverse.text';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let text: string;
  if (context instanceof Command.Context) {
    text = context.message.convertContent({text: args.text});
  } else {
    text = args.text;
  }
  const reversed = text.split('').reverse().join('');
  return displayReply(context, {description: Markup.escape.all(reversed)});
}
