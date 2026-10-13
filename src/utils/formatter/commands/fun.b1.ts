import { Command, Interaction } from 'detritus-client';

import { CDN } from '../../../api/endpoints';
import { Mimetypes } from '../../../constants';
import { displayReply, mediaReplyFromOptions } from '../..';


export const COMMAND_ID = 'fun.b1';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const url = CDN.URL + CDN.COMMAND_ASSETS_B1;
  try {
    const value = await context.rest.get(url);
    return mediaReplyFromOptions(context, value, {
      extension: 'png',
      filename: 'b1',
      mimetype: Mimetypes.IMAGE_PNG,
      size: value.length,
    });
  } catch(error) {
    return displayReply(context, {description: url});
  }
}
