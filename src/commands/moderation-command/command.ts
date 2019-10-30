import { Command } from 'detritus-client';

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';
import { onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  delete: boolean,
  command: string,
}

export default (<Command.CommandOptions> {
  name: 'command',
  args: [{name: 'delete', aliases: ['disable', 'remove'], type: Boolean}],
  aliases: ['cmd'],
  disableDm: true,
  label: 'command',
  metadata: {
    description: 'Server-wide disable a command',
    examples: [
      'command rule34',
    ],
    type: CommandTypes.MODERATION_COMMAND,
    usage: 'command <command-name>',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  onBefore: (context) => context.user.isClientOwner,
  run: async (context, args: CommandArgs) => {
    const command = context.commandClient.getCommand({content: args.command, prefix: ''});
    if (!command) {
      return context.reply('Unknown Command');
    }

    const guildId = <string> context.guildId;
    if (args.delete) {
      await deleteGuildDisabledCommand(context, guildId, command.name, guildId);
      return context.reply(`Ok, re-enabled ${command.name} server-wide`);
    } else {
      await createGuildDisabledCommand(context, guildId, command.name, guildId, GuildDisableCommandsTypes.GUILD);
      return context.reply(`Ok, disabled ${command.name} server-wide`);
    }
  },
  onRunError,
  onTypeError,
});
