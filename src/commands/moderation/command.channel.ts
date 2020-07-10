import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { createGuildDisabledCommand, deleteGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  payload: {
    channel: Structures.Channel | null,
    command: Command.Command | null,
  },
  enable: boolean,
}

export interface CommandArgs {
  payload: {
    channel: Structures.Channel,
    command: Command.Command,
  },
  enable: boolean,
}

export default class CommandChannelCommand extends BaseCommand {
  aliases = ['cmd channel'];
  name = 'command channel';

  disableDm = true;
  label = 'payload';
  metadata = {
    description: 'Channel-wide disable a command (WIP)',
    examples: [
      'command channel rule34 <#560593330270896129>',
      'command channel rule34 <#560593330270896129> -enable',
    ],
    type: CommandTypes.MODERATION,
    usage: 'command channel <command-name> <channel> (-enable)',
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
    return !!(args.payload.command && args.payload.channel);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.payload.command) {
      return context.editOrReply('⚠ Unknown Command');
    }
    return context.editOrReply('⚠ Unknown Channel');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return context.editOrReply('WIP');
  }
}
