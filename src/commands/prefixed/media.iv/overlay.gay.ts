import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay gay';

export default class OverlayLGBTCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o gay', 'gay', 'overlay lgbt', 'o lgbt', 'lgbt'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Overlay a LGBT flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagLGBT.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagLGBT.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLGBT.createMessage(context, args);
  }
}
