import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'openverse';

export default class OpenverseCommand extends BaseSearchCommand{
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['openverse image', 'openverse img'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Openverse for openly licensed images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -randomize`,
        ],
        id: Formatter.Commands.SearchOpenverse.COMMAND_ID,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchOpenverse.CommandArgs) {
    return Formatter.Commands.SearchOpenverse.createMessage(context, args);
  }
}
