import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay eu';

export default class OverlayEUCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o eu', 'overlay europe', 'o europe', 'eu', 'europe'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay an EU flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagEU.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagEU.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEU.createMessage(context, args);
  }
}
