import { Command, Interaction } from 'detritus-client';

import { mediaICreateFoggyWindow } from '../../../api';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.foggy.window';
export const MAX_TEXT_LENGTH = 20;

export interface CommandArgs {
  text: string,
  background?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateFoggyWindow(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
    background: args.background,
  });
  return mediaReply(context, response);
}
