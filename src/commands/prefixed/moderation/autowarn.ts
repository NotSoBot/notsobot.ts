import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn';

export default class AutowarnCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autowarn list', 'autowarns'],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List this server\'s auto-warn rules, what makes me warn members myself',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID,
        usage: '',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.ModerationAutowarn.createMessage(context);
  }
}
