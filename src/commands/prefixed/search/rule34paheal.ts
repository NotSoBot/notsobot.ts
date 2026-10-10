import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'rule34paheal';

export default class Rule34PahealCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['r34paheal', 'r34p', 'paheal', 'pahe'],
      args: [
        {aliases: ['r', 'random'], name: 'randomize', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'This command has been disabled at Discord\'s request.',
        examples: [],
        id: Formatter.Commands.SearchRule34Paheal.COMMAND_ID,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchRule34Paheal.CommandArgs) {
    return Formatter.Commands.SearchRule34Paheal.createMessage(context, args);
  }
}
