import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'crop nft';

export default class CropNFTCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'background', aliases: ['b'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Crop out a Twitter NFT Hex from an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -background`,
        ],
        id: Formatter.Commands.MediaIVToolsCropNFT.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-background)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsCropNFT.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCropNFT.createMessage(context, args);
  }
}
