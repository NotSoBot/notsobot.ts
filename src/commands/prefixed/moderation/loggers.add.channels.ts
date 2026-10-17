import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add channels';

export default class LoggersAddChannelsCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.CHANNELS, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for channel events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel channel-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        id: 'server.loggers.add.channels',
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
