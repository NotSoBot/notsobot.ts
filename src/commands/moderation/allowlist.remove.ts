import { Collections, Command } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { deleteGuildAllowlist, editGuildSettings } from '../../api';
import { GuildSettings } from '../../api/structures/guildsettings';
import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../constants';
import GuildSettingsStore from '../../stores/guildsettings';

import AllowlistAddCommand, { AllowlistPayload, CommandArgs, getItemsFromMention } from './allowlist.add';
import { createAllowlistEmbed } from './allowlist';


export async function removeAllowlist(
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
        title = `Removed Channel (${channel.id}) from Allowlist`;
      }; break;
      case GuildAllowlistTypes.ROLE: {
        const { item: role } = payload;
        title = `Removed Role (${role.id}) from Allowlist`;
      }; break;
      case GuildAllowlistTypes.USER: {
        const { item: user } = payload;
        title = `Removed User (${user.id}) from Allowlist`;
      }; break;
    }

    await deleteGuildAllowlist(context, guildId, payload.item.id, payload.type);
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
    title = `Removed ${comments.join(', ')} from Allowlist`;

    settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

    const allowlist = new Collections.BaseCollection<string, {id: string, type: string}>();
    for (let [key, allowed] of settings.allowlist) {
      allowlist.set(key, {id: allowed.id, type: allowed.type});
    }
    for (let {item, type} of payloads) {
      const key = `${item.id}.${type}`;
      allowlist.delete(key);
    }
    settings = await editGuildSettings(context, guildId, {
      allowlist: allowlist.toArray(),
    });
  }
  return {settings, title};
}


export default class AllowlistRemoveCommand extends AllowlistAddCommand {
  aliases = ['allowlist delete'];
  name = 'allowlist remove';

  disableDm = true;
  label = 'payloads';
  metadata = {
    description: 'Remove an allowlist item based on the mention type.',
    examples: [
      'allowlist remove <#585639594574217232>',
      'allowlist remove <@300505364032389122> <@&178314191524855808>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'allowlist remove ...<channel|role|user mention>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.ADMINISTRATOR];
  priority = -1;
  type = getItemsFromMention;

  async run(context: Command.Context, args: CommandArgs) {
    const { payloads } = args;
    const { settings, title } = await removeAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
