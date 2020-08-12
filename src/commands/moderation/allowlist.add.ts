import { Collections, Command, Structures } from 'detritus-client';
import { DiscordRegexNames, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup, regex as discordRegex } from 'detritus-client/lib/utils';

import { createGuildAllowlist, editGuildSettings } from '../../api';
import { GuildSettings } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';

import { BaseCommand } from '../basecommand';

import { createAllowlistEmbed } from './allowlist';


export interface CommandArgsBefore {
  payloads: Array<AllowlistPayload> | null,
}

export interface CommandArgs {
  payloads: Array<AllowlistPayload>,
}

export type AllowlistPayload = {
  item: Structures.Channel,
  type: GuildAllowlistTypes.CHANNEL,
} | {
  item: Structures.Role,
  type: GuildAllowlistTypes.ROLE,
} | {
  item: Structures.User,
  type: GuildAllowlistTypes.USER,
};

export async function getItemsFromMention(
  value: string,
  context: Command.Context,
) {
  if (!value) {
    return null;
  }
  const payloads: Array<AllowlistPayload> = [];
  if (context.guild) {
    {
      const { matches } = discordRegex(DiscordRegexNames.MENTION_CHANNEL, value) as {matches: Array<{id: string}>};
      const channelIds = new Collections.BaseSet<string>(matches.map(({id}) => id));
      for (let channelId of channelIds) {
        const channel = context.guild.channels.get(channelId);
        if (channel && (channel.isGuildCategory || channel.isGuildNews || channel.isGuildText)) {
          payloads.push({
            item: channel,
            type: GuildAllowlistTypes.CHANNEL,
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
            type: GuildAllowlistTypes.ROLE,
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
            type: GuildAllowlistTypes.USER,
          });
        }
      }
    }
  }
  return payloads;
}


export async function createAllowlist(
  context: Command.Context,
  payloads: Array<AllowlistPayload>,
) {
  const guildId = context.guildId as string;

  let title = 'Allowlist';
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildAllowlistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = `Added Channel (${channel.id}) to Allowlist`;
      }; break;
      case GuildAllowlistTypes.ROLE: {
        const { item: role } = payload;
        title = `Added Role (${(role.isDefault) ? role.name : role.id}) to Allowlist`;
      }; break;
      case GuildAllowlistTypes.USER: {
        const { item: user } = payload;
        title = `Added User (${user.id}) to Allowlist`;
      }; break;
    }

    await createGuildAllowlist(context, guildId, payload.item.id, payload.type);
    settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
    // update settings
  } else {
    let channels = 0,
      roles = 0,
      users = 0;
    for (let payload of payloads) {
      switch (payload.type) {
        case GuildAllowlistTypes.CHANNEL: channels++; break;
        case GuildAllowlistTypes.ROLE: roles++; break;
        case GuildAllowlistTypes.USER: users++; break;
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
    title = `Added ${comments.join(', ')} to Allowlist`;

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    settings = await editGuildSettings(context, guildId, {
      allowlist: [
        ...payloads.map((payload) => ({id: payload.item.id, type: payload.type})),
        ...settings.allowlist.map((allowed) => ({id: allowed.id, type: allowed.type})),
      ],
    });
  }
  return {settings, title};
}


// make this support multiple
export default class AllowlistAddCommand extends BaseCommand {
  name = 'allowlist add';

  disableDm = true;
  label = 'payloads';
  metadata = {
    description: 'Allow an item based on mention type.',
    examples: [
      'allowlist add <#585639594574217232>',
      'allowlist add <@300505364032389122> <@&178314191524855808>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'allowlist add ...<channel|role|user mention>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.ADMINISTRATOR];
  priority = -1;
  type = getItemsFromMention;

  // maybe add owner check?
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { payloads } = args;
    return !!payloads && !!payloads.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.payloads) {
      return context.editOrReply('⚠ Unable to find any valid Text Channels, Roles, or Users');
    }
    return context.editOrReply('⚠ Provide some kind of mention');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { payloads } = args;
    const { settings, title } = await createAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
