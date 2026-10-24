import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay saudiarabia';

export default class OverlaySaudiArabiaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o saudiarabia', 'overlay saudi', 'o saudi', 'saudiarabia', 'saudi'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Saudi Arabian flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSaudiArabia.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaudiArabia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaudiArabia.createMessage(context, args);
  }
}
