import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../../constants';
import { Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { createAllowlistEmbed } from './allowlist';
import { createAllowlist } from './allowlist.add';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel>,
}

export const COMMAND_NAME = 'allowlist add channels';

export default class AllowlistAddChannelsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['allowlist add channel'],
      default: null,
      disableDm: true,
      label: 'channels',
      metadata: {
        description: 'Add channels to the allowlist.',
        examples: [
          `${COMMAND_NAME} lobby`,
          `${COMMAND_NAME} <#585639594574217232> <#560595518129045504>`,
        ],
        type: CommandTypes.MODERATION,
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

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.channels && !!args.channels.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.channels) {
      return editOrReply(context, '⚠ Unable to find any valid Text Channels.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { channels } = args;
    const payloads: Array<{
      item: Structures.Channel,
      type: GuildAllowlistTypes.CHANNEL,
    }> = channels.map((channel) => ({item: channel, type: GuildAllowlistTypes.CHANNEL}));
    const { settings, title } = await createAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
