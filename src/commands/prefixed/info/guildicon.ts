import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'guildicon';

export default class GuildIconCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'payload',
      metadata: {
        description: 'Get the icon for a guild, defaults to the current guild',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 178313653177548800`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoGuildIcon.COMMAND_ID,
        usage: '?<guild:id>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.guildMetadata,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoGuildIcon.CommandArgsBefore) {
    return !!args.payload.guild;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoGuildIcon.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoGuildIcon.CommandArgs) {
    return Formatter.Commands.InfoGuildIcon.createMessage(context, args);
  }
}
