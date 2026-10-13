import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist remove channels';

export default class BlocklistRemoveChannelsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'blocklist remove channel',
        'blocklist delete channel',
        'blocklist delete channels',
      ],
      disableDm: true,
      label: 'channels',
      metadata: {
        description: 'Remove channels from the blocklist.',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> <#560595518129045504>`,
        ],
        category: CommandCategories.SERVER,
        id: Formatter.Commands.ModerationBlocklistRemoveChannels.COMMAND_ID,
        usage: '...<channel:id|mention|name>',
      },
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

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveChannels.CommandArgsBefore) {
    return !!args.channels && !!args.channels.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveChannels.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.channels) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_channels')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.needs_query')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveChannels.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistRemoveChannels.createMessage(context, args);
  }
}
