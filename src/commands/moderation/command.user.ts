import { Command, CommandClient, Constants, Structures } from 'detritus-client';
const { Permissions } = Constants;

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  payload: {
    command: Command.Command | null,
    user: Structures.Member | Structures.User | null,
  },
  enable: boolean,
}

export interface CommandArgs {
  payload: {
    command: Command.Command,
    user: Structures.Member | Structures.User,
  },
  enable: boolean,
}

export default class CommandUserCommand extends BaseCommand {
  aliases = ['cmd user'];
  name = 'command user';

  disableDm = true;
  label = 'payload';
  metadata = {
    description: 'Disable a command for a user. (WIP)',
    examples: [
      'command user rule34 NotSoSuper#1',
      'command user rule34 <@296044494812479498> -enable',
    ],
    type: CommandTypes.MODERATION,
    usage: 'command user <command-name> <user> (-enable)',
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
    return !!(args.payload.command && args.payload.user);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.payload.command) {
      return context.editOrReply('⚠ Unknown Command');
    }
    return context.editOrReply('⚠ Unknown User');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return context.editOrReply('WIP');
  }
}
