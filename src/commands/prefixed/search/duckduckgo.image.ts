import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'duckduckgo image';

export default class DuckDuckGoImageCommand extends BaseSearchCommand{
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ddg img'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
        {name: 'safe', default: DefaultParameters.safe, type: () => true},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search DuckDuckGo Images',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} something nsfw -safe`,
          `${COMMAND_NAME} notsobot -randomize`,
          `${COMMAND_NAME} notsobot -r`,
        ],
        id: Formatter.Commands.SearchDuckDuckGoImages.COMMAND_ID,
        usage: '<query> (-randomize)  (-safe)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchDuckDuckGoImages.CommandArgs) {
    return Formatter.Commands.SearchDuckDuckGoImages.createMessage(context, args);
  }
}
