import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export default class GiphyCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['gif'];
  name = 'giphy';

  metadata = {
    description: 'Search Giphy',
    examples: [
      'giphy dancing',
    ],
    type: CommandTypes.SEARCH,
    usage: 'giphy <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
