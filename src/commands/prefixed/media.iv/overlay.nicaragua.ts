import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay nicaragua';

export default class OverlayNicaraguaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o nicaragua', 'nicaragua'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Nicaraguan flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagNicaragua.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagNicaragua.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNicaragua.createMessage(context, args);
  }
}
