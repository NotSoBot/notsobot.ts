import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildCommandsBlocklistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands blocklist';

export default class CommandsBlocklistCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds blocklist'],
      choices: Object.values(GuildCommandsBlocklistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildCommandsBlocklistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List all blocked commands (and their associated type)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        id: Formatter.Commands.ModerationCommandsBlocklist.COMMAND_ID,
        usage: '?<GuildCommandsBlocklistType>',
      },
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklist.CommandArgs) {
    return Formatter.Commands.ModerationCommandsBlocklist.createMessage(context, args);
  }
}
