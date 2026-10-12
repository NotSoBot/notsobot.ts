import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist add channels';

export default class BlocklistAddChannelsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['blocklist add channel'],
      disableDm: true,
      label: 'channels',
      metadata: {
        description: 'Add channels to the blocklist.',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> <#560595518129045504>`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationBlocklistAddChannels.COMMAND_ID,
        usage: '...<channel:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.channels({
        types: [
          ChannelTypes.GUILD_CATEGORY,
          ChannelTypes.GUILD_NEWS,
          ChannelTypes.GUILD_TEXT,
        ],
      }),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAddChannels.CommandArgsBefore) {
    return !!args.channels && !!args.channels.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAddChannels.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.channels) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.no_valid_channels')}`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} ${translate('errors.needs_query')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAddChannels.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistAddChannels.createMessage(context, args);
  }
}
