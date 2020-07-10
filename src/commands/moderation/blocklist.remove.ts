import { Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { deleteGuildBlocklist, editGuildSettings } from '../../api';
import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import GuildSettingsStore, { GuildSettingsStored } from '../../stores/guildsettings';

import BlocklistAddCommand, { BlocklistPayload, CommandArgs, getItemsFromMention } from './blocklist.add';
import { createBlocklistEmbed } from './blocklist';


export async function removeBlocklist(
  context: Command.Context,
  payloads: Array<BlocklistPayload>,
) {
  const guildId = context.guildId as string;

  let title = 'Blocklist';
  let settings: GuildSettingsStored;
  if (payloads.length === 1) {
    const [ payload ] = payloads;
    switch (payload.type) {
      case GuildBlocklistTypes.CHANNEL: {
        const { item: channel } = payload;
        title = `Removed Channel (${channel.mention}) from Blocklist`;
      }; break;
      case GuildBlocklistTypes.ROLE: {
        const { item: role } = payload;
        title = `Removed Role (${role.mention}) from Blocklist`;
      }; break;
      case GuildBlocklistTypes.USER: {
        const { item: user } = payload;
        title = `Removed User (${user.mention}) from Blocklist`;
      }; break;
    }

    await deleteGuildBlocklist(context, guildId, payload.item.id);
    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettingsStored;
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

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettingsStored;

    const blocklist: Array<{id: string, type: string}> = [];
    for (let blocked of settings.blocklist) {
      if (!payloads.some(({item}) => item.id === blocked.id)) {
        blocklist.push({id: blocked.id, type: blocked.type});
      }
    }
    settings = await editGuildSettings(context, guildId, {blocklist});
  }
  GuildSettingsStore.set(guildId, settings);
  return {settings, title};
}


export default class BlocklistRemoveCommand extends BlocklistAddCommand {
  aliases = ['blocklist delete'];
  name = 'blocklist remove';

  disableDm = true;
  label = 'payloads';
  metadata = {
    description: 'Remove a blocked item based on the mention type.',
    examples: [
      'blocklist remove <#585639594574217232>',
      'blocklist remove <@300505364032389122> <@&178314191524855808>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist remove ...<channel|role|user mention>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  priority = -1;
  type = getItemsFromMention;

  async run(context: Command.Context, args: CommandArgs) {
    const { payloads } = args;
    const { settings, title } = await removeBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
