import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

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
      type: Parameters.guildMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoGuild.CommandArgsBefore) {
    return !!args.payload.guild;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoGuild.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoGuild.CommandArgs) {
    return Formatter.Commands.InfoGuild.createMessage(context, args);
  }
}
