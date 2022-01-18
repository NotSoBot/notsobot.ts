import { Command, CommandClient, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildSettings } from '../../../api';
import { CommandTypes } from '../../../constants';
import { DefaultParameters, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  guild: Structures.Guild | null,
}

export interface CommandArgs {
  guild: Structures.Guild,
}


export const COMMAND_NAME = 'owner block guild';

export default class OwnerBlockGuildCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: DefaultParameters.guild,
      label: 'guild',
      metadata: {
        description: 'Block a guild from the bot',
        examples: [
          `${COMMAND_NAME} 178313653177548800`,
        ],
        type: CommandTypes.OWNER,
        usage: '<guild:id>',
      },
      type: Parameters.guild,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.guild;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.guild) {
      return editOrReply(context, '⚠ Unable to find that guild.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { guild } = args;

    const settings = await editGuildSettings(context, guild.id, {blocked: true});
    return editOrReply(context, `Alright, blocked guild ${Markup.escape.all(guild.name)} (${guild.id})}.`);
  }
}
