import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ImageBackgroundRemovalModels } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  model?: string,
  url?: null | string,
}

export const COMMAND_NAME = 'background remove';

export default class GrayscaleCommand extends BaseImageCommand<Formatter.Commands.ImageBackgroundRemove.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['background rm', 'bg remove', 'bg rm'],
      args: [
        {name: 'model', choices: Object.values(ImageBackgroundRemovalModels), help: `Must be one of: (${Object.values(ImageBackgroundRemovalModels).join(', ')})`},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Remove the background of an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -model U2NETP`,
        ],
        id: Formatter.Commands.ImageBackgroundRemove.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-model <ImageBackgroundRemovalModels>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageBackgroundRemove.CommandArgs) {
    return Formatter.Commands.ImageBackgroundRemove.createMessage(context, args);
  }
}
