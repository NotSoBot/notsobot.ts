import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay bernie';

export default class OverlayBernie1Command extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o bernie', 'bernie'],
      metadata: {
        description: 'Overlay an Image or Video over a sign pointed at by Bernie Sanders',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsBernie1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsBernie1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsBernie1.createMessage(context, args);
  }
}
