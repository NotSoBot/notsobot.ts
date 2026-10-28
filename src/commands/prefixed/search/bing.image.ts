import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'bing image';

export default class BingImageCommand extends BaseSearchCommand{
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['bing img', 'bing images'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Bing Images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -randomize`,
        ],
        id: Formatter.Commands.SearchBingImages.COMMAND_ID,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchBingImages.CommandArgs) {
    return Formatter.Commands.SearchBingImages.createMessage(context, args);
  }
}
