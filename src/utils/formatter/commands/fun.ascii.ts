import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { funASCII } from '../../../api';
import { imageReplyFromOptions } from '../../../utils';


export const COMMAND_ID = 'fun.ascii';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await funASCII(context, args);
  const file = response.file;
  const text = response.arguments?.text;

  let content: string | undefined;
  if (text && text.length <= 560) {
    content = Markup.codeblock(text, {language: 'fix'});
  }

  const value = Buffer.from(file.value, 'base64');
  return imageReplyFromOptions(context, value, {
    content,
    filename: file.filename,
    height: file.metadata.height,
    size: value.length,
    width: file.metadata.width,
  });
}
