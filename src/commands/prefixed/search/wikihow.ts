import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'wikihow';

export default class WikihowCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wiki', 'how'],
      args: [
        {name: 'random', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search WikiHow',
        examples: [
          `${COMMAND_NAME} cut tree`,
          `${COMMAND_NAME} -random`,
        ],
        id: Formatter.Commands.SearchWikihow.COMMAND_ID,
        usage: '<query> (-random)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SearchWikihow.CommandArgs) {
    return !!args.query || !!args.random;
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchWikihow.CommandArgs) {
    return Formatter.Commands.SearchWikihow.createMessage(context, args);
  }
}
