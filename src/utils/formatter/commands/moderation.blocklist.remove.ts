import { Collections, Command, Interaction } from 'detritus-client';

import { deleteGuildBlocklist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { GuildBlocklistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';

import * as ModerationBlocklist from './moderation.blocklist';
import * as ModerationBlocklistAdd from './moderation.blocklist.add';


export interface CommandArgsBefore {
  payloads: Array<ModerationBlocklistAdd.BlocklistPayload> | null,
}

export interface CommandArgs {
  payloads: Array<ModerationBlocklistAdd.BlocklistPayload>,
}

export async function removeBlocklist(
  context: Command.Context | Interaction.InteractionContext,
  payloads: Array<ModerationBlocklistAdd.BlocklistPayload>,
) {
  const guildId = context.guildId as string;

  let title = 'Blocklist';
  let settings: GuildSettings;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildBlocklistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = `Removed Channel (${channel.id}) from Blocklist`;
      }; break;
      case GuildBlocklistTypes.ROLE: {
        const { item: role } = payload;
        title = `Removed Role (${role.id}) from Blocklist`;
      }; break;
      case GuildBlocklistTypes.USER: {
        const { item: user } = payload;
        title = `Removed User (${user.id}) from Blocklist`;
      }; break;
    }

    await deleteGuildBlocklist(context, guildId, payload.item.id, payload.type);
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
    title = `Removed ${comments.join(', ')} from Blocklist`;

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

    const blocklist = new Collections.BaseCollection<string, {id: string, type: string}>();
    for (let [key, blocked] of settings.blocklist) {
      blocklist.set(key, {id: blocked.id, type: blocked.type});
    }
    for (let {item, type} of payloads) {
      const key = `${item.id}.${type}`;
      blocklist.delete(key);
    }
    settings = await editGuildSettings(context, guildId, {
      blocklist: blocklist.toArray(),
    });
  }
  return {settings, title};
}

export const COMMAND_ID = 'blocklist.remove';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { payloads } = args;
  const { settings, title } = await removeBlocklist(context, payloads);
  return ModerationBlocklist.createBlocklistEmbed(context, settings.blocklist, {title});
}
