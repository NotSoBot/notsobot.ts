import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add moderation';

export default class LoggersAddModerationCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.MODERATION, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for warnings given, removed and cleared.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel mod-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.moderation',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
