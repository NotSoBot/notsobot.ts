import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay miranda';

export default class OverlayMirandaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o miranda', 'miranda'],
      metadata: {
        description: 'Overlay an Image or Video on a car window behind Miranda Cosgrove',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsMirandaCosgrove1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsMirandaCosgrove1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsMirandaCosgrove1.createMessage(context, args);
  }
}
