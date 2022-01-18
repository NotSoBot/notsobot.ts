import { Collections, Command, CommandClient, Structures } from 'detritus-client';
import { DiscordRegexNames, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup, regex as discordRegex } from 'detritus-client/lib/utils';

import { createGuildBlocklist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';

import { BaseCommand } from '../basecommand';

import { createBlocklistEmbed } from './blocklist';


export interface CommandArgsBefore {
  payloads: Array<BlocklistPayload> | null,
}

export interface CommandArgs {
  payloads: Array<BlocklistPayload>,
}

export type BlocklistPayload = {
  item: Structures.Channel,
  type: GuildBlocklistTypes.CHANNEL,
} | {
  item: Structures.Role,
  type: GuildBlocklistTypes.ROLE,
} | {
  item: Structures.User,
  type: GuildBlocklistTypes.USER,
};

export async function getItemsFromMention(
  value: string,
  context: Command.Context,
) {
  if (!value) {
    return null;
  }
  const payloads: Array<BlocklistPayload> = [];
  if (context.guild) {
    {
      const { matches } = discordRegex(DiscordRegexNames.MENTION_CHANNEL, value) as {matches: Array<{id: string}>};
      const channelIds = new Collections.BaseSet<string>(matches.map(({id}) => id));
      for (let channelId of channelIds) {
        const channel = context.guild.channels.get(channelId);
        if (channel && (channel.isGuildCategory || channel.isGuildNews || channel.isGuildText)) {
          payloads.push({
            item: channel,
            type: GuildBlocklistTypes.CHANNEL,
          });
        }
      }
    }
    {
      const { matches } = discordRegex(DiscordRegexNames.MENTION_ROLE, value) as {matches: Array<{id: string}>};
      const roleIds = new Collections.BaseSet<string>(matches.map(({id}) => id));
      for (let roleId of roleIds) {
        const role = context.guild.roles.get(roleId);
        if (role) {
          payloads.push({
            item: role,
            type: GuildBlocklistTypes.ROLE,
          });
        }
      }
    }
    {
      const { matches } = discordRegex(DiscordRegexNames.MENTION_USER, value) as {matches: Array<{id: string}>};
      const userIds = new Collections.BaseSet<string>(matches.map(({id}) => id));
      if (5 <= userIds.length) {
        throw new Error('Too many users in one message');
      }
      for (let userId of userIds) {
        let user = context.users.get(userId);
        if (!user) {
          try {
            user = await context.rest.fetchUser(userId);
          } catch(error) {}
        }
        if (user && !user.bot) {
          payloads.push({
            item: user,
            type: GuildBlocklistTypes.USER,
          });
        }
      }
    }
  }
  return payloads;
}


export async function createBlocklist(
  context: Command.Context,
  payloads: Array<BlocklistPayload>,
) {
  const guildId = context.guildId as string;

  let title = 'Blocklist';
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildBlocklistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = `Added Channel (${channel.id}) to Blocklist`;
      }; break;
      case GuildBlocklistTypes.ROLE: {
        const { item: role } = payload;
        title = `Added Role (${(role.isDefault) ? role.name : role.id}) to Blocklist`;
      }; break;
      case GuildBlocklistTypes.USER: {
        const { item: user } = payload;
        title = `Added User (${user.id}) to Blocklist`;
      }; break;
    }

    await createGuildBlocklist(context, guildId, payload.item.id, payload.type);
    settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
    // update settings
  } else {
    let channels = 0,
      roles = 0,
      users = 0;
    for (let payload of payloads) {
      switch (payload.type) {
        case GuildBlocklistTypes.CHANNEL: channels++; break;
        case GuildBlocklistTypes.ROLE: roles++; break;
        case GuildBlocklistTypes.USER: users++; break;
      }
    }
    const comments: Array<string> = [];
    if (channels) {
      comments.push(`${channels} Channels`);
    }
    if (roles) {
      comments.push(`${roles} Roles`);
    }
    if (users) {
      comments.push(`${users} Users`);
    }
    title = `Added ${comments.join(', ')} to Blocklist`;

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    settings = await editGuildSettings(context, guildId, {
      blocklist: [
        ...payloads.map((payload) => ({id: payload.item.id, type: payload.type})),
        ...settings.blocklist.map((blocked) => ({id: blocked.id, type: blocked.type})),
      ],
    });
  }
  return {settings, title};
}


export const COMMAND_NAME = 'blocklist add';

export default class BlocklistAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'payloads',
      metadata: {
        description: 'Add an item based on mention type to the blocklist.',
        examples: [
          `${COMMAND_NAME} <#585639594574217232>`,
          `${COMMAND_NAME} <@300505364032389122> <@&178314191524855808>`,
        ],
        type: CommandTypes.MODERATION,
        usage: '...<channel:mention,role:mention,user:mention>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: getItemsFromMention,
    });
  }

  // maybe add owner check?
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { payloads } = args;
    return !!payloads && !!payloads.length && !payloads.some((payload) => {
      return payload.type === GuildBlocklistTypes.USER && payload.item.id === context.userId;
    });
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.payloads) {
      if (args.payloads.length) {
        return context.editOrReply('⚠ Don\'t block yourself dummy');
      }
      return context.editOrReply('⚠ Unable to find any valid Text Channels, Roles, or Users');
    }
    return context.editOrReply('⚠ Provide some kind of mention');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { payloads } = args;
    const { settings, title } = await createBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
