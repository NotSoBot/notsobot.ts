import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay tajikistan';

export default class OverlayTajikistanCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o tajikistan', 'tajikistan'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Tajik flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagTajikistan.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagTajikistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTajikistan.createMessage(context, args);
  }
}
