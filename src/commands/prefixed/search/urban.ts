import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'urban';

export default class UrbanCommand extends BaseSearchCommand<Formatter.Commands.SearchUrban.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Urban Dictionary',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.SearchUrban.COMMAND_ID,
        usage: '?<query>',
      },
      priority: -1,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SearchUrban.CommandArgs) {
    return true;
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchUrban.CommandArgs) {
    return Formatter.Commands.SearchUrban.createMessage(context, args);
  }
}
