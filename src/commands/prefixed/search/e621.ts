import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'e621';

export default class E621Command extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search e621, a furry NSFW image board',
        examples: [
          `${COMMAND_NAME} discord`,
          `${COMMAND_NAME} discord -randomize`,
          `${COMMAND_NAME} discord -r`,
        ],
        id: Formatter.Commands.SearchE621.COMMAND_ID,
        nsfw: true,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchE621.CommandArgs) {
    return Formatter.Commands.SearchE621.createMessage(context, args);
  }
}
