import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add decoy';

export default class LoggersAddDecoyCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.DECOY, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for who posts in the decoy channel and what happened to them',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel decoy-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.decoy',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
