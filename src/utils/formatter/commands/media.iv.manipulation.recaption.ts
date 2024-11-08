import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationCaption, mediaIVManipulationUncaption } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.recaption';

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  tolerance?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  const uncaptionResponse = await mediaIVManipulationUncaption(context, {
    file: args.file,
    tolerance: args.tolerance,
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
