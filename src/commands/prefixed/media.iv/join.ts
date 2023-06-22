import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'join';

export default class JoinCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'noresize', type: Boolean},
        {name: 'loop', type: Boolean},
        {name: 'vertical', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Join two medias together',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
        ],
        id: Formatter.Commands.MediaIVToolsJoin.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-loop) (-vertical)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsJoin.CommandArgs) {
    return Formatter.Commands.MediaIVToolsJoin.createMessage(context, args);
  }
}
