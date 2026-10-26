import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add reports';

export default class LoggersAddReportsCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.REPORTS, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for members\' reports to the moderators, with buttons to resolve or dismiss them.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel reports`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.reports',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
