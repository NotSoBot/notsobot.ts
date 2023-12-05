import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay starman';

export default class OverlayBobRossCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o starman', 'starman'],
      metadata: {
        description: 'Overlay Elon Musk\'s Starman over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOverlayStarman.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayStarman.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayStarman.createMessage(context, args);
  }
}
