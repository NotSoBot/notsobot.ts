import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay saintlucia';

export default class OverlaySaintLuciaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o saintlucia', 'saintlucia'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Saint Lucian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSaintLucia.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaintLucia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaintLucia.createMessage(context, args);
  }
}
