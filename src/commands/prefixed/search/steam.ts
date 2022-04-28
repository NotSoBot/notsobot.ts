import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'steam';

export default class SteamCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'as'},
      ],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Search Steam Community for a user',
        examples: [
          `${COMMAND_NAME} Chocolate Coconut Cake`,
          `${COMMAND_NAME} NotSoSuper -as 76561198000146360`,
        ],
        id: Formatter.Commands.SearchSteamCommunity.COMMAND_ID,
        usage: '<query>',
        // usage: '<query> (-as <steam-id>)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchSteamCommunity.CommandArgs) {
    return Formatter.Commands.SearchSteamCommunity.createMessage(context, args);
  }
}
