import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'glow';

export default class GlowCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Add a soft glow to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amount 10`,
        ],
        id: Formatter.Commands.MediaIVManipulationGlow.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationGlow.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlow.createMessage(context, args);
  }
}
