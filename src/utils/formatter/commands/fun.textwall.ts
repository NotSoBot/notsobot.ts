import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'fun.textwall';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const text = args.text.slice(0, 50);

  let content = '';
  for (let i = 0; i < text.length; i++) {
    content += `\n${text.slice(i, text.length)} ${text.slice(0, i)}`;
  }

  return editOrReply(context, Markup.codeblock(content));
}
