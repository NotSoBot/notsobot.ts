import { Command, CommandClient } from 'detritus-client';

import { imageToolsBackgroundRemove } from '../../../api';
import { CommandTypes, ImageBackgroundRemovalModels } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  model?: string,
  url?: null | string,
}

export interface CommandArgs {
  model?: string,
  url: string,
}

export const COMMAND_NAME = 'background remove';

export default class GrayscaleCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['background rm', 'bg remove', 'bg rm'],
      args: [
        {name: 'model', choices: Object.values(ImageBackgroundRemovalModels), help: `Must be one of: (${Object.values(ImageBackgroundRemovalModels).join(', ')})`},
      ],
      metadata: {
        description: 'Remove the background of an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -model U2NETP`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-model <ImageBackgroundRemovalModels>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageToolsBackgroundRemove(context, args);
    return imageReply(context, response);
  }
}
