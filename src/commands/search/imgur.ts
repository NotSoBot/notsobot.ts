import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export default class ImgurCommand extends BaseSearchCommand<CommandArgs> {
  name = 'imgur';

  metadata = {
    description: 'Search Imgur',
    examples: [
      'imgur cat',
    ],
    type: CommandTypes.SEARCH,
    usage: 'imgur <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
