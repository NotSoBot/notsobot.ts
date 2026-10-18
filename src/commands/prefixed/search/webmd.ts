import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'webmd';

// not registered (no default export) until its formatter has an implementation, an empty command showed up in help and never replied
export class WebMDCommand extends BaseSearchCommand<CommandArgs> {
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
        category: CommandCategories.SEARCH,
        id: Formatter.Commands.SearchWebMD.COMMAND_ID,
        usage: '<query> (-random)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchWebMD.CommandArgs) {
    return Formatter.Commands.SearchWebMD.createMessage(context, args);
  }
}
