import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add voice';

export default class LoggersAddVoiceCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.VOICE, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for voice events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel voice-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.SERVER,
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
