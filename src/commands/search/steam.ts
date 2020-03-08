import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export default class SteamCommand extends BaseSearchCommand<CommandArgs> {
  name = 'steam';

  metadata = {
    description: 'Search Steam',
    examples: [
      'steam NotSoSuper',
    ],
    type: CommandTypes.SEARCH,
    usage: 'steam <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
