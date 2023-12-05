import { Command, Interaction } from 'detritus-client';

import { audioToolsPutMix } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.a.tools.put.mix';

export interface CommandArgs {
  longest?: boolean,
  noloop?: boolean,
  urls: Array<string>,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  args.urls = args.urls.reverse();
  const response = await audioToolsPutMix(context, args);
  return mediaReply(context, response);
}
