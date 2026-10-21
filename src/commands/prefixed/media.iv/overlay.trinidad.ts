import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay trinidad';

export default class OverlayTrinidadCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o trinidad', 'trinidad'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Trinidad and Tobago flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagTrinidad.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagTrinidad.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTrinidad.createMessage(context, args);
  }
}
