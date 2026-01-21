import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-nft';

export class MediaIVToolsCropNFTCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop out a Twitter NFT Hex from an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCropNFT.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCropNFT.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCropNFT.createMessage(context, args);
  }
}
