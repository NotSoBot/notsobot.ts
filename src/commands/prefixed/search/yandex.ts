import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'yandex';

export default class YandexCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ya', 'yandex search', 'ya search'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Yandex',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -randomize`,
        ],
        id: Formatter.Commands.SearchYandex.COMMAND_ID,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchYandex.CommandArgs) {
    return Formatter.Commands.SearchYandex.createMessage(context, args);
  }
}
