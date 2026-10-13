import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add bans';

export default class LoggersAddBansCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.BANS, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for ban events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel ban-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
