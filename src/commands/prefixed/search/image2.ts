import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'image2';

export default class Image2Command extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['img2', 'im2'],
      args: [
        {name: 'randomize', aliases: ['r', 'random'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Images from Bing, DuckDuckGo, or Google, but with less data displayed',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -randomize`,
        ],
        id: Formatter.Commands.SearchImages.COMMAND_ID_SIMPLE,
        usage: '<query> (-randomize)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchImages.CommandArgs) {
    return Formatter.Commands.SearchImages.createMessage(context, {
      ...args,
      simple: true,
    });
  }
}
