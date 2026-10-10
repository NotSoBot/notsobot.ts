import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-nft';

export class MediaIVToolsCropNFTCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop out a Twitter NFT Hex from an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropNFT.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropNFT.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropNFT.createMessage(context, args);
  }
}
