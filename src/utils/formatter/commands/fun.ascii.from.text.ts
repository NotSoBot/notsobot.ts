import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { funAsciiArtFromText } from '../../../api';
import { mediaReplyFromOptions } from '../../../utils';


export const COMMAND_ID = 'fun.ascii';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await funAsciiArtFromText(context, args);
  const { file } = response.items[0];
  const text = response.arguments?.text;

  let content: string | undefined;
  if (text && text.length <= 560) {
    content = Markup.codeblock(text, {language: 'fix'});
  }

  const value = (file.value) ? Buffer.from(file.value, 'base64') : Buffer.alloc(0);
  return mediaReplyFromOptions(context, value, {
    content,
    extension: file.metadata.extension,
    filename: file.filename_safe_base,
    height: file.metadata.height,
    mimetype: file.metadata.mimetype,
    size: value.length,
    width: file.metadata.width,
  });
}
