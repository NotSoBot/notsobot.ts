import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'join';

export default class JoinCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      // the old bot's `merge` (and `merge vertical` is `merge -vertical`)
      aliases: ['merge'],
      args: [
        {name: 'noresize', aliases: ['nr'], type: Boolean},
        {name: 'noloop', aliases: ['nl'], type: Boolean},
        {name: 'vertical', aliases: ['v'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Put two Images or Videos side by side (or stacked)',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -vertical`,
        ],
        id: Formatter.Commands.MediaAIVManipulationJoin.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-noloop) (-noresize) (-vertical)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationJoin.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationJoin.createMessage(context, args);
  }
}
