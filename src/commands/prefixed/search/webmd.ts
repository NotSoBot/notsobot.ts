import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'webmd';

export default class WebMDCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'random', type: Boolean},
      ],
      metadata: {
        description: 'Search WebMD',
        examples: [
          `${COMMAND_NAME} red spot on finger`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
