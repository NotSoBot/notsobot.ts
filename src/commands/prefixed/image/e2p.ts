import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'e2p';

export default class E2PCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['edges2porn'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Edges to Porn',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ImageManipulationE2P.COMMAND_ID,
        nsfw: true,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageManipulationE2P.CommandArgs) {
    return Formatter.Commands.ImageManipulationE2P.createMessage(context, args);
  }
}
