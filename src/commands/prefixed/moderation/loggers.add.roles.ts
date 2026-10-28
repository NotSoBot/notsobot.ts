import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add roles';

export default class LoggersAddRolesCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.ROLES, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for role events',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel role-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.roles',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
