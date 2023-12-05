import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteGuildCommandsAllowlist, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { GuildCommandsAllowlistTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';

import { createCommandsAllowlistsEmbed } from './moderation.commands.allowlist';


export const COMMAND_ID = 'moderation.commands.allowlist.remove';

export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
  command: Command.Command | null,
  roles: Array<Structures.Role> | null,
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel> | null,
  command: Command.Command,
  roles: Array<Structures.Role> | null,
  users: Array<Structures.Member | Structures.User> | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { command } = args;
  const commandId = (command.metadata && command.metadata.id) ? command.metadata.id : command.name.split(' ').join('.');
  const guildId = context.guildId!;

  const isServerWide = !args.channels && !args.roles && !args.users;

  let settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;

  let title = `Removed ${Markup.codestring(commandId)}`;
  if (isServerWide) {
    title = `${title} server-wide`;
    await deleteGuildCommandsAllowlist(context, guildId, commandId, guildId, GuildCommandsAllowlistTypes.GUILD);
    settings = (await GuildSettingsStore.fetch(context, guildId))!;
  } else {
    let channels = 0, roles = 0, users = 0;

    const payloads = [];
    if (args.channels) {
      channels = args.channels.length;
      for (let channel of args.channels) {
        payloads.push({item: channel, type: GuildCommandsAllowlistTypes.CHANNEL});
      }
    }
    if (args.roles) {
      roles = args.roles.length;
      for (let role of args.roles) {
        payloads.push({item: role, type: GuildCommandsAllowlistTypes.ROLE});
      }
    }
    if (args.users) {
      users = args.users.length;
      for (let user of args.users) {
        payloads.push({item: user, type: GuildCommandsAllowlistTypes.USER});
      }
    }
  
    for (let payload of payloads) {
      const key = `${commandId}.${payload.item.id}.${payload.type}`;
      if (settings.commandsAllowlist.has(key)) {
        await deleteGuildCommandsAllowlist(context, guildId, commandId, payload.item.id, payload.type);
      }
    }
    settings = (await GuildSettingsStore.fetch(context, guildId))!;
  
    const comments: Array<string> = [];
    if (channels) {
      comments.push(`${channels.toLocaleString()} Channel${(channels === 1) ? '' : 's'}`);
    }
    if (roles) {
      comments.push(`${roles.toLocaleString()} Role${(roles === 1) ? '' : 's'}`);
    }
    if (users) {
      comments.push(`${users.toLocaleString()} User${(users === 1) ? '' : 's'}`);
    }
    title = `Removed ${comments.join(', ')} from the allowlist for ${title}`;
  
    /*
    if (payloads.length === 1) {
      // do single
      const [ payload ] = payloads;
      await deleteGuildCommandsAllowlist(context, guildId, command.name, payload.item.id, payload.type);
      settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
    } else {
      // do multiple
      settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
  
      const commandsAllowlist = new Collections.BaseCollection<string, {command: string, id: string, type: string}>();
      for (let [key, disabled] of settings.commandsAllowlist) {
        commandsAllowlist.set(key, {command: command.name, id: disabled.id, type: disabled.type});
      }
      for (let {item, type} of payloads) {
        const key = `${command.name}.${item.id}.${type}`;
        commandsAllowlist.delete(key);
      }
      settings = await editGuildSettings(context, guildId, {
        commandsAllowlist: commandsAllowlist.toArray(),
      });
    }
    */
  }
  return createCommandsAllowlistsEmbed(context, settings.commandsAllowlist, {title});
}
