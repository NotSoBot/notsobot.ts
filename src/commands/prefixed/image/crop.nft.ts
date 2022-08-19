import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export const COMMAND_NAME = 'crop nft';

export default class CropNFTCommand extends BaseImageCommand<Formatter.Commands.ImageToolsCropNFT.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'background', aliases: ['b'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Crop out a Twitter NFT Hex from an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -background`,
        ],
        id: Formatter.Commands.ImageToolsCropNFT.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-background)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageToolsCropNFT.CommandArgs) {
    return Formatter.Commands.ImageToolsCropNFT.createMessage(context, args);
  }
}
