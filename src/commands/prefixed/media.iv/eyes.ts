import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaEyeTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes';

export default class EyesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['eye'],
      args: [
        {name: 'type', choices: Object.values(MediaEyeTypes), help: `Must be one of: (${Object.values(MediaEyeTypes).join(', ')})`},
      ],
      metadata: {
        description: 'Attach eyes to people\'s faces in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg -type spongebob`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationEyes.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-type <MediaEyeTypes>)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationEyes.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyes.createMessage(context, args);
  }
}
