import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay linus';

export default class OverlayLinus1Command extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o linus', 'linus'],
      metadata: {
        description: 'Overlay an Image or Video over a monitor with Linus Tech Tips',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsLTTLinus1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsLTTLinus1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsLTTLinus1.createMessage(context, args);
  }
}
