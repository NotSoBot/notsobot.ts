import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'instantcamera';

export default class InstantcameraCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['polaroid'],
      args: [
        {aliases: ['c', 'text'], label: 'text', name: 'caption', type: String},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Turn an Image or Video into an instant camera photo',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -caption good times`,
        ],
        id: Formatter.Commands.MediaIVManipulationInstantCamera.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-caption <text>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationInstantCamera.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInstantCamera.createMessage(context, args);
  }
}
