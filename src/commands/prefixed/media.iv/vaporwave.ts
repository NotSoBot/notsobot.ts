import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, imageReply } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'vaporwave';

export default class VaporwaveCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Vaporwave-theme an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @NotSoBot what an idiot`,
        ],
        id: Formatter.Commands.MediaIVManipulationVaporwave.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...text>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', consume: true},
      ],
    });
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationVaporwave.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationVaporwave.createMessage(context, args);
  }
}
