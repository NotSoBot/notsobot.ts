import { Command, CommandClient } from 'detritus-client';

import { imageManipulationEyes } from '../../../api';
import { CommandCategories, ImageEyeTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  type?: ImageEyeTypes,
  url?: null | string,
}

export interface CommandArgs {
  type?: ImageEyeTypes,
  url: string,
}

export const COMMAND_NAME = 'eyes';

export default class EyesCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['eye'],
      args: [
        {name: 'type', choices: Object.values(ImageEyeTypes), help: `Must be one of: (${Object.values(ImageEyeTypes).join(', ')})`},
      ],
      metadata: {
        description: 'Attach eyes to people\'s faces in an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg -type spongebob`,
        ],
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-type <ImageEyeTypes>)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationEyes(context, args);
    return imageReply(context, response);
  }
}
