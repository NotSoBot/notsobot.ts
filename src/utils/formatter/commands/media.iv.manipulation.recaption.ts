import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCaption, mediaIVManipulationUncaption } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.recaption';

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const uncaptionResponse = await mediaIVManipulationUncaption(context, {
    url: args.url,
  });

  const response = await mediaIVManipulationCaption(context, {
    file: {
      contentType: uncaptionResponse.file.metadata.mimetype,
      filename: uncaptionResponse.file.filename,
      value: Buffer.from(uncaptionResponse.file.value, 'base64'),
    },
    font: args.font,
    text: args.text,
  })
  
  return imageReply(context, response);
}
