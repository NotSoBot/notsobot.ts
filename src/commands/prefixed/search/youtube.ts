import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'youtube';

export default class YoutubeCommand extends BaseSearchCommand<Formatter.Commands.SearchYoutube.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['yt'],
      args: [{name: 'sp'}],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Youtube',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.SearchYoutube.COMMAND_ID,
        usage: '<query> (-sp <string>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchYoutube.CommandArgs) {
    return Formatter.Commands.SearchYoutube.createMessage(context, args);
  }
}
