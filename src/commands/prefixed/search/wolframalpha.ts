import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'wolframalpha';

export default class WebMDCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wa'],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Wolfram Alpha',
        examples: [
          `${COMMAND_NAME} 5 plus 5`,
        ],
        id: Formatter.Commands.SearchWolframAlpha.COMMAND_ID,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchWolframAlpha.CommandArgs) {
    return Formatter.Commands.SearchWolframAlpha.createMessage(context, args);
  }
}
