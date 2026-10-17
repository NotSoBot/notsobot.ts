import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';

import { createGuildAllowlist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { GuildAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { getCachedTranslator, getTranslator } from '../../i18n';

import * as ModerationAllowlist from './moderation.allowlist';


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
  context: Command.Context | Interaction.InteractionContext,
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
            type: GuildAllowlistTypes.USER,
          });
        }
      }
    }
  }
  return payloads;
}

export async function createAllowlist(
  context: Command.Context | Interaction.InteractionContext,
  payloads: Array<AllowlistPayload>,
) {
  const guildId = context.guildId as string;
  const { translate } = await getTranslator(context);

  let title = translate('moderation.allowlist.title');
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildAllowlistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = translate('moderation.allowlist.add_channel', {id: channel.id});
      }; break;
      case GuildAllowlistTypes.ROLE: {
        const { item: role } = payload;
        title = translate('moderation.allowlist.add_role', {id: (role.isDefault) ? role.name : role.id});
      }; break;
      case GuildAllowlistTypes.USER: {
        const { item: user } = payload;
        title = translate('moderation.allowlist.add_user', {id: user.id});
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
      comments.push(translate('moderation.count.channels', {count: channels}));
    }
    if (roles) {
      comments.push(translate('moderation.count.roles', {count: roles}));
    }
    if (users) {
      comments.push(translate('moderation.count.users', {count: users}));
    }
    title = translate('moderation.allowlist.add_many', {items: comments.join(', ')});

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
    // keep existing entries keyed so re-adding one doesn't duplicate it (and count twice towards the limit)
    // the api only takes {id, type} and leaves rows that already exist alone, so their added/userId is kept
    const allowlist = new Collections.BaseCollection<string, {id: string, type: string}>();
    for (let [key, allowed] of settings.allowlist) {
      allowlist.set(key, {id: allowed.id, type: allowed.type});
    }
    for (let {item, type} of payloads) {
      const key = `${item.id}.${type}`;
      if (!allowlist.has(key)) {
        allowlist.set(key, {id: item.id, type});
      }
    }
    settings = await editGuildSettings(context, guildId, {
      allowlist: allowlist.toArray(),
    });
  }
  return {settings, title};
}

export const COMMAND_ID = 'server.allowlist.add';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { payloads } = args;
  const { settings, title } = await createAllowlist(context, payloads);
  return ModerationAllowlist.createAllowlistEmbed(context, settings.allowlist, {title});
}
