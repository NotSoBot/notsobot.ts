import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  command: Command.Command | null | undefined,
}

export interface CommandArgs {
  command: Command.Command | undefined,
}

export default class HelpCommand extends BaseCommand {
  name = 'help';

  label = 'command';
  metadata = {
    description: 'HELP!',
    examples: [
      'help',
      'help google',
    ],
    type: CommandTypes.UTILS,
    usage: 'help ?<command>',
  };
  type = (content: string, context: Command.Context) => {
    if (content) {
      return context.commandClient.getCommand({content, prefix: ''});
    }
    return undefined;
  };

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return args.command !== null;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Unknown Command');
  }

  run(context: Command.Context, args: CommandArgs) {
    if (args.command) {
      return context.editOrReply(`${args.command.name}`);
    }
    return context.editOrReply(`${context.user.mention}, this is our rewrite bot. <https://beta.notsobot.com/commands> (We are moving from python to typescript because ya)`);
  }
}
