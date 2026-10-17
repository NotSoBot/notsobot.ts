import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add messages';

export default class LoggersAddMessagesCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.MESSAGES, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for message events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel message-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.messages',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
