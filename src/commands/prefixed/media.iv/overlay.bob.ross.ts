import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay bobross';

export default class OverlayBobRossCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o bobross', 'bobross'],
      metadata: {
        description: 'Overlay an Image or Video over a Bob Ross canvas',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsBobRoss.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsBobRoss.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsBobRoss.createMessage(context, args);
  }
}
