import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'giphy';

export default class GiphyCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['gif'],
      metadata: {
        description: 'Search Giphy',
        examples: [
          `${COMMAND_NAME} dancing`,
        ],
        category: CommandCategories.SEARCH,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
