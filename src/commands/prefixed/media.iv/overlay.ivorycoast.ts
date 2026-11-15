import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay ivorycoast';

export default class OverlayIvoryCoastCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o ivorycoast', 'overlay cotedivoire', 'o cotedivoire', 'ivorycoast', 'cotedivoire'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Ivorian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagIvoryCoast.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagIvoryCoast.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIvoryCoast.createMessage(context, args);
  }
}
