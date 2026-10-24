import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, RedditKindTypes, RedditSortTypes, RedditTimeTypes} from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'reddit';

export default class RedditCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'sort', choices: Object.values(RedditSortTypes), help: `Must be one of: (${Object.values(RedditSortTypes).join(', ')})`, type: (value) => value.toUpperCase()},
        {name: 'subreddit', metadata: {description: '1 to 20 characters'}},
        {name: 'time', choices: Object.values(RedditTimeTypes), help: `Must be one of: (${Object.values(RedditTimeTypes).join(', ')})`, type: (value) => value.toUpperCase()},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Reddit',
        examples: [
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -subreddit discordapp`,
        ],
        id: Formatter.Commands.SearchReddit.COMMAND_ID,
        usage: '<query> (-sort <choice>) (-subreddit <string>) (-time <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchReddit.CommandArgs) {
    return Formatter.Commands.SearchReddit.createMessage(context, args);
  }
}
