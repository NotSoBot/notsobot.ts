import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay northkorea';

export default class OverlayNorthKoreaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o northkorea', 'overlay nk', 'o nk', 'northkorea', 'nk'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Overlay a North Korean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagNorthKorea.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagNorthKorea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNorthKorea.createMessage(context, args);
  }
}
