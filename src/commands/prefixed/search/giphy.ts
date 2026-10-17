import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'giphy';

// not registered (no default export) until its formatter has an implementation, an empty command showed up in help and never replied
export class GiphyCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Search Giphy',
        examples: [
          `${COMMAND_NAME} dancing`,
        ],
        category: CommandCategories.SEARCH,
        id: Formatter.Commands.SearchGiphy.COMMAND_ID,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchGiphy.CommandArgs) {
    return Formatter.Commands.SearchGiphy.createMessage(context, args);
  }
}
