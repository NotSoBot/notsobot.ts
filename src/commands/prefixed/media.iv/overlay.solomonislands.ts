import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay solomonislands';

export default class OverlaySolomonIslandsCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o solomonislands', 'overlay solomon', 'o solomon', 'solomonislands', 'solomon'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Solomon Islands flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSolomonIslands.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSolomonIslands.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSolomonIslands.createMessage(context, args);
  }
}
