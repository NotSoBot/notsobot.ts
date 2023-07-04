import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'imgur';

export default class ImgurCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Imgur',
        examples: [
          `${COMMAND_NAME} cat`,
        ],
        id: Formatter.Commands.SearchImgur.COMMAND_ID,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchImgur.CommandArgs) {
    return Formatter.Commands.SearchImgur.createMessage(context, args);
  }
}
