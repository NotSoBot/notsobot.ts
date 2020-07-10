import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export default class WebMDCommand extends BaseSearchCommand<CommandArgs> {
  name = 'webmd';

  metadata = {
    description: 'Search WebMD',
    examples: [
      'webmd red spot on finger',
    ],
    type: CommandTypes.SEARCH,
    usage: 'webmd <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
