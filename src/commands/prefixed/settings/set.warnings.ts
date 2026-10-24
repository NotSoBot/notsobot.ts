import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set warnings';

export default class SetWarningsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'expire', aliases: ['expiry', 'delete'], type: Formatter.Commands.SettingsServerSetWarnings.expireParser},
        {name: 'window', aliases: ['active'], type: Formatter.Commands.SettingsServerSetWarnings.windowParser},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change how long warnings count as active (default 30 days) and when they get deleted (default never)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -window 14 days`,
          `${COMMAND_NAME} -expire 1 year`,
          `${COMMAND_NAME} -expire never`,
        ],
        id: Formatter.Commands.SettingsServerSetWarnings.COMMAND_ID,
        usage: '(-expire <duration|never>) (-window <duration>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetWarnings.CommandArgs) {
    return Formatter.Commands.SettingsServerSetWarnings.createMessage(context, args);
  }
}
