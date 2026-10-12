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
        {name: 'listeners', type: Boolean},
        {name: 'stores', type: Boolean},
      ],
      metadata: {
        description: 'Reload the bot\'s commands.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -stores`,
          `${COMMAND_NAME} -listeners`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerRefresh.COMMAND_ID,
        usage: '(-listeners) (-stores)',
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
