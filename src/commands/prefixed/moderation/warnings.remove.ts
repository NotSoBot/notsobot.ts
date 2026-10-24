import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'warnings remove';

export default class WarningsRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['warnings delete', 'unwarn'],
      disableDm: true,
      label: 'ids',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Remove warnings by their ids (from the `warnings` list)',
        examples: [
          `${COMMAND_NAME} 1430000000000000000`,
          `${COMMAND_NAME} 1430000000000000000 1430000000000000001`,
        ],
        id: Formatter.Commands.ModerationWarningsRemove.COMMAND_ID,
        usage: '...<id:snowflake>',
      },
      permissions: [Permissions.MODERATE_MEMBERS],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationWarningsRemove.CommandArgs) {
    return Formatter.Commands.ModerationWarningsRemove.createMessage(context, args);
  }
}
