import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'e2e';

export default class E2ECommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['edges2emoji'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Edges to Emoji',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ImageManipulationE2E.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageManipulationE2E.CommandArgs) {
    return Formatter.Commands.ImageManipulationE2E.createMessage(context, args);
  }
}
