import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'rules clear';

export default class RulesClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Remove every rule in this server',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.ModerationRulesClear.COMMAND_ID,
        usage: '',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.ModerationRulesClear.createMessage(context);
  }
}
