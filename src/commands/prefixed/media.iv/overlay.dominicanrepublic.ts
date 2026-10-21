import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay dominicanrepublic';

export default class OverlayDominicanRepublicCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o dominicanrepublic', 'dominicanrepublic'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Dominican Republic flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagDominicanRepublic.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagDominicanRepublic.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDominicanRepublic.createMessage(context, args);
  }
}
