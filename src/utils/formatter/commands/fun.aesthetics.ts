import { Command, Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'fun.aesthetics';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let content = '';
  for (let i = 0; i < args.text.length; i++) {
    const code = args.text.charCodeAt(i);
    if (code < 33 || 127 < code) {
      content += args.text[i];
    } else {
      content += String.fromCharCode(code + 65248);
    }
  }
  // maybe delete original message and dont reply like the original bot does?
  return editOrReply(context, content);
}
