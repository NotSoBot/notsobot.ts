import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'spheres';

export default class SpheresCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['sphere', 'galatea'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Hang an Image or Video as Dali\'s Galatea of the Spheres',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationSpheres.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSpheres.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpheres.createMessage(context, args);
  }
}
