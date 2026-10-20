import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay hawking';

export default class OverlayHawkingCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o hawking', 'hawking', 'hawk', 'stephen'],
      metadata: {
        description: 'Overlay an Image or Video on a chalkboard next to Stephen Hawking',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayPersonsStephenHawking1.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayPersonsStephenHawking1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsStephenHawking1.createMessage(context, args);
  }
}
