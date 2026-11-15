import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay equatorialguinea';

export default class OverlayEquatorialGuineaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o equatorialguinea', 'equatorialguinea'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an Equatorial Guinean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagEquatorialGuinea.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagEquatorialGuinea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEquatorialGuinea.createMessage(context, args);
  }
}
