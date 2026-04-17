import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaSlideDirections } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'orb';

export default class OrbCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'direction', aliases: ['d'], type: Parameters.oneOf({choices: MediaSlideDirections})},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Create a spinning Globe/Orb out of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -direction left`,
        ],
        id: Formatter.Commands.MediaIVManipulationOrb.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-direction <MediaSlideDirections>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOrb.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOrb.createMessage(context, args);
  }
}
