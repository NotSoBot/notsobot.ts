import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { funAsciiArtFromImage } from '../../../api';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'fun.ascii.from.image';

export interface CommandArgs {
  mobile?: boolean,
  size?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (args.mobile) {
    args.size = 10;
  }
  const response = await funAsciiArtFromImage(context, args);
  const language = '';
  return editOrReply(context, Markup.codeblock(response.text, {language}));
}
