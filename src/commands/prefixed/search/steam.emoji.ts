import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'steam emoji';

export default class SteamEmojiCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['steam e'],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search all of Steam\'s Emojis',
        examples: [
          `${COMMAND_NAME} b1`,
          `${COMMAND_NAME} sleep`,
        ],
        id: Formatter.Commands.SearchSteamEmojis.COMMAND_ID,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchSteamEmojis.CommandArgs) {
    return Formatter.Commands.SearchSteamEmojis.createMessage(context, args);
  }
}
