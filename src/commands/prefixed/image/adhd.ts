import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'adhd';

export default class ADHDCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['h'], name: 'horizontal', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add random gameplay to an audio/image/video file',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaAIVManipulationADHD.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-horizontal)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationADHD.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationADHD.createMessage(context, args);
  }
}
