import { Command, CommandClient, Constants } from 'detritus-client';
const { Permissions } = Constants;

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  command: Command.Command | null,
  enable: boolean,
}

export interface CommandArgs {
  command: Command.Command,
  enable: boolean,
}

export default class CommandCommand extends BaseCommand {
  aliases = ['cmd'];
  name = 'command';

  disableDm = true;
  label = 'command';
  metadata = {
    description: 'Server-wide disable a command',
    examples: [
      'command rule34',
      'command rule34 -enable',
    ],
    type: CommandTypes.MODERATION,
    usage: 'command <command-name> (-enable)',
  };
  permissions = [Permissions.MANAGE_GUILD];
  type = (content: string, context: Command.Context) => context.commandClient.getCommand({content, prefix: ''});

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{name: 'enable', type: Boolean}],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.command;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unknown Command');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { command } = args;

    const guildId = <string> context.guildId;
    if (args.enable) {
      await deleteGuildDisabledCommand(context, guildId, command.name, guildId);
      return context.reply(`Ok, enabled ${command.name} server-wide`);
    } else {
      await createGuildDisabledCommand(context, guildId, command.name, guildId, GuildDisableCommandsTypes.GUILD);
      return context.reply(`Ok, disabled ${command.name} server-wide`);
    }
  }
}
