import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay hongkong';

export default class OverlayHongKongCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o hongkong', 'overlay hk', 'o hk', 'hongkong', 'hk'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Hong Kong flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagHongKong.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagHongKong.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagHongKong.createMessage(context, args);
  }
}
