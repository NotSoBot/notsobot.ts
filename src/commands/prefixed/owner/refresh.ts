import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'refresh';

export default class RefreshCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reload'],
      args: [
        {name: 'pull', type: Boolean},
        {name: 'respawn', type: Boolean},
        {name: 'voice', type: Boolean},
      ],
      metadata: {
        description: 'Build the source into lib (with -pull pulled from github first), then reload the bot\'s commands, listeners and stores (stores keep their cached data), with -voice the voice node client and with -respawn respawn every cluster one at a time afterwards',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -voice`,
          `${COMMAND_NAME} -respawn`,
          `${COMMAND_NAME} -pull -respawn`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerRefresh.COMMAND_ID,
        usage: '(-pull) (-respawn) (-voice)',
      },
      responseOptional: true,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerRefresh.CommandArgs) {
    return Formatter.Commands.OwnerRefresh.createMessage(context, args);
  }
}
