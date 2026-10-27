import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay vanuatu';

export default class OverlayVanuatuCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o vanuatu', 'vanuatu'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Ni-Vanuatu flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagVanuatu.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagVanuatu.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagVanuatu.createMessage(context, args);
  }
}
