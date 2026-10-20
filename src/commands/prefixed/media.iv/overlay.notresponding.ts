import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay notresponding';

export default class OverlayNotRespondingCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o notresponding', 'overlay frozen', 'o frozen'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a frozen Windows "Not Responding" window on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayNotResponding.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayNotResponding.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayNotResponding.createMessage(context, args);
  }
}
