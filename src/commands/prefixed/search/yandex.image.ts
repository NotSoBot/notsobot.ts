import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'yandex image';

export default class YandexImageCommand extends BaseSearchCommand{
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['yandex img', 'ya img'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Yandex Images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -randomize`,
        ],
        id: Formatter.Commands.SearchYandexImages.COMMAND_ID,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchYandexImages.CommandArgs) {
    return Formatter.Commands.SearchYandexImages.createMessage(context, args);
  }
}
