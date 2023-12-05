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
        {name: 'noloop', type: Boolean},
        {name: 'vertical', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Join two medias together',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
        ],
        id: Formatter.Commands.MediaAIVToolsJoin.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-noloop) (-vertical)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsJoin.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsJoin.createMessage(context, args);
  }
}
