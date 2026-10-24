import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay southkorea';

export default class OverlaySouthKoreaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o southkorea', 'overlay korea', 'o korea', 'southkorea', 'korea'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a South Korean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagSouthKorea.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagSouthKorea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSouthKorea.createMessage(context, args);
  }
}
