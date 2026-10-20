import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay bisexual';

export default class OverlayBisexualCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o bisexual', 'overlay bi', 'o bi', 'bisexual'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Bisexual pride flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagBisexual.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagBisexual.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBisexual.createMessage(context, args);
  }
}
