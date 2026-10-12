import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import { createGuildBlocklist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { getCachedTranslator, getTranslator } from '../../i18n';

import * as ModerationBlocklist from './moderation.blocklist';


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
  context: Command.Context | Interaction.InteractionContext,
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
        throw new Error(getCachedTranslator(context).translate('moderation.too_many_users_in_message'));
      }
      for (let userId of userIds) {
        let user = context.client.users.get(userId);
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
  context: Command.Context | Interaction.InteractionContext,
  payloads: Array<BlocklistPayload>,
) {
  const guildId = context.guildId as string;
  const { translate } = await getTranslator(context);

  let title = translate('moderation.blocklist.title');
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildBlocklistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = translate('moderation.blocklist.add_channel', {id: channel.id});
      }; break;
      case GuildBlocklistTypes.ROLE: {
        const { item: role } = payload;
        title = translate('moderation.blocklist.add_role', {id: (role.isDefault) ? role.name : role.id});
      }; break;
      case GuildBlocklistTypes.USER: {
        const { item: user } = payload;
        title = translate('moderation.blocklist.add_user', {id: user.id});
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
      comments.push(translate('moderation.count.channels', {count: channels}));
    }
    if (roles) {
      comments.push(translate('moderation.count.roles', {count: roles}));
    }
    if (users) {
      comments.push(translate('moderation.count.users', {count: users}));
    }
    title = translate('moderation.blocklist.add_many', {items: comments.join(', ')});

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

export const COMMAND_ID = 'blocklist.add';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { payloads } = args;
  const { settings, title } = await createBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
