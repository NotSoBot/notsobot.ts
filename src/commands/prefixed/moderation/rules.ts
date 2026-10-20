import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'rules';

export default class RulesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['rules list'],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List the rules deciding who can use which commands in this server',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.ModerationRules.COMMAND_ID,
        usage: '',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.ModerationRules.createMessage(context);
  }
}
