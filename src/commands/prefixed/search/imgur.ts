import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'imgur';

export default class ImgurCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Search Imgur',
        examples: [
          `${COMMAND_NAME} cat`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    
  }
}
