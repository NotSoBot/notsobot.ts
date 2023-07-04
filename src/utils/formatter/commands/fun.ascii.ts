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
  const { image, text } = await funASCII(context, args);

  let content: string | undefined;
  if (text.length <= 560) {
    content = Markup.codeblock(text, {language: 'fix'});
  }

  const value = Buffer.from(image.data, 'base64');
  return imageReplyFromOptions(context, value, {
    content,
    filename: image.details.filename,
    height: image.details.height,
    size: value.length,
    width: image.details.width,
  });
}
