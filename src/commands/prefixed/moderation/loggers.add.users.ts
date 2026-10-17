import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add users';

export default class LoggersAddUsersCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.USERS, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for user events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel user-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.users',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
