import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'guild';

export default class GuildCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['guildinfo', 'server', 'serverinfo'],
      label: 'payload',
      metadata: {
        description: 'Get information for a guild, defaults to the current guild',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 178313653177548800`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoGuild.COMMAND_ID,
        usage: '?<guild:id>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.guildMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoGuild.CommandArgsBefore) {
    return !!args.payload.guild;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.InfoGuild.CommandArgsBefore) {
    return editOrReply(context, `${StatusEmojis.WARNING} Unable to find that guild.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoGuild.CommandArgs) {
    return Formatter.Commands.InfoGuild.createMessage(context, args);
  }
}
