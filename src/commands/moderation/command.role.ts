import { Command, CommandClient, Constants, Structures } from 'detritus-client';
const { Permissions } = Constants;

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  payload: {
    command: Command.Command | null,
    role: Structures.Role | null,
  },
  enable: boolean,
}

export interface CommandArgs {
  payload: {
    command: Command.Command,
    role: Structures.Role,
  },
  enable: boolean,
}

export default class CommandRoleCommand extends BaseCommand {
  aliases = ['cmd role'];
  name = 'command role';

  disableDm = true;
  label = 'payload';
  metadata = {
    description: 'Disable a command for a role. (WIP)',
    examples: [
      'command role rule34 everyone',
      'command role rule34 <@&178313653177548800> -enable',
    ],
    type: CommandTypes.MODERATION,
    usage: 'command role <command-name> <role> (-enable)',
  };
  permissions = [Permissions.MANAGE_GUILD];
  priority = 1;
  type = () => ({});

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{name: 'enable', type: Boolean}],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.payload.command && args.payload.role);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.payload.command) {
      return context.editOrReply('⚠ Unknown Command');
    }
    return context.editOrReply('⚠ Unknown Role');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return context.editOrReply('WIP');
  }
}
