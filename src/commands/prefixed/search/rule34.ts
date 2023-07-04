import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'rule34';

export default class Rule34Command extends BaseSearchCommand {
  nsfw = true;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['r34'],
      args: [
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search https://rule34.xxx',
        examples: [
          `${COMMAND_NAME} some anime chick`,
          `${COMMAND_NAME} overwatch`,
          `${COMMAND_NAME} overwatch -randomize`,
          `${COMMAND_NAME} overwatch -r`,
        ],
        id: Formatter.Commands.SearchRule34.COMMAND_ID,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchRule34.CommandArgs) {
    return Formatter.Commands.SearchRule34.createMessage(context, args);
  }
}
