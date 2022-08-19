import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'crop-nft';

export class ImageToolsCropNFTCommand extends BaseInteractionImageCommandOption {
  description = 'Crop out a Twitter NFT Hex from an Image';
  metadata = {
    id: Formatter.Commands.ImageToolsCropNFT.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'background',
          description: 'Include a dark background (default: False)',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageToolsCropNFT.CommandArgs) {
    return Formatter.Commands.ImageToolsCropNFT.createMessage(context, args);
  }
}
