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
        {name: 'voice', type: Boolean},
      ],
      metadata: {
        description: 'Reload the bot\'s commands, listeners and stores (stores keep their cached data), and with -voice the voice node client',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -voice`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerRefresh.COMMAND_ID,
        usage: '(-voice)',
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
