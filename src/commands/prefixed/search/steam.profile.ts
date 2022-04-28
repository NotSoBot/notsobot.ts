import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseSearchCommand } from '../basecommand';


export const COMMAND_NAME = 'steam profile';

export default class SteamProfileCommand extends BaseSearchCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Show information about a Steam User\'s Profile',
        examples: [
          `${COMMAND_NAME} coconut_cake`,
          `${COMMAND_NAME} 76561198000146360`,
        ],
        id: Formatter.Commands.SearchSteamProfile.COMMAND_ID,
        usage: '<steam-id|steam-vanity>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchSteamProfile.CommandArgs) {
    return Formatter.Commands.SearchSteamProfile.createMessage(context, args);
  }
}
