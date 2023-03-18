import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'e2p';

export default class E2PCommand extends BaseImageOrVideoCommand {
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
        id: Formatter.Commands.MediaIVManipulationE2P.COMMAND_ID,
        nsfw: true,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationE2P.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationE2P.createMessage(context, args);
  }
}
