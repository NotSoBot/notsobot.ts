import { CommandClient } from 'detritus-client';

import { CommandCategories, GuildLoggerTypes } from '../../../constants';

import { LoggersAddBaseCommand } from './loggers.add.base';


export const COMMAND_NAME = 'loggers add members';

export default class LoggersAddMembersCommand extends LoggersAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, GuildLoggerTypes.MEMBERS, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a logger for member events.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -channel member-logs`,
          `${COMMAND_NAME} -in logs`,
        ],
        category: CommandCategories.MODERATION,
        usage: '(-channel <text-channel:id|mention|name>) (-in <category-channel:id|mention|name>)',
      },
    });
  }
}
