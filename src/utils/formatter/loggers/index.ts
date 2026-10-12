import { ClientEvents } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed } from 'detritus-client/lib/utils';

import * as Bans from './bans';
import * as Channels from './channels';
import * as Members from './members';
import * as Messages from './messages';
import * as Roles from './roles';
import * as Users from './users';
import * as Voice from './voice';

import { sanitizeEmbed } from './tools';
import { GuildLoggingEventItem, LogPayload, LogPayloadFiles, LogPayloadOptions } from './types';

export * from './tools';
export * from './types';
export { Bans, Channels, Members, Messages, Roles, Users, Voice };


export function createLogPayload(event: GuildLoggingEventItem, options: LogPayloadOptions = {}): LogPayload {
  if (options.componentsV2) {
    return createLogPayloadComponents(event);
  }
  return createLogPayloadEmbed(event);
}


export function createLogPayloadEmbed(event: GuildLoggingEventItem): LogPayload {
  const embed = new Embed();
  const files: LogPayloadFiles = [];
  switch (event.name) {
    case ClientEvents.CHANNEL_CREATE: Channels.formatChannelCreate(event, embed, files); break;
    case ClientEvents.CHANNEL_DELETE: Channels.formatChannelDelete(event, embed, files); break;
    case ClientEvents.CHANNEL_UPDATE: Channels.formatChannelUpdate(event, embed, files); break;
    case ClientEvents.GUILD_BAN_ADD: Bans.formatGuildBanAdd(event, embed, files); break;
    case ClientEvents.GUILD_BAN_REMOVE: Bans.formatGuildBanRemove(event, embed, files); break;
    case ClientEvents.GUILD_MEMBER_ADD: Members.formatGuildMemberAdd(event, embed, files); break;
    case ClientEvents.GUILD_MEMBER_REMOVE: Members.formatGuildMemberRemove(event, embed, files); break;
    case ClientEvents.GUILD_MEMBER_UPDATE: Members.formatGuildMemberUpdate(event, embed, files); break;
    case ClientEvents.GUILD_ROLE_CREATE: Roles.formatGuildRoleCreate(event, embed, files); break;
    case ClientEvents.GUILD_ROLE_DELETE: Roles.formatGuildRoleDelete(event, embed, files); break;
    case ClientEvents.GUILD_ROLE_UPDATE: Roles.formatGuildRoleUpdate(event, embed, files); break;
    case ClientEvents.MESSAGE_DELETE: Messages.formatMessageDelete(event, embed, files); break;
    case ClientEvents.MESSAGE_DELETE_BULK: Messages.formatMessageDeleteBulk(event, embed, files); break;
    case ClientEvents.MESSAGE_UPDATE: Messages.formatMessageUpdate(event, embed, files); break;
    case ClientEvents.USERS_UPDATE: Users.formatUsersUpdate(event, embed, files); break;
    case ClientEvents.VOICE_STATE_UPDATE: Voice.formatVoiceStateUpdate(event, embed, files); break;
  }
  return {embed: sanitizeEmbed(embed), files};
}


export function createLogPayloadComponents(event: GuildLoggingEventItem): LogPayload {
  const container = new ComponentContainer();
  const files: LogPayloadFiles = [];
  switch (event.name) {
    case ClientEvents.CHANNEL_CREATE: Channels.formatChannelCreateComponents(event, container, files); break;
    case ClientEvents.CHANNEL_DELETE: Channels.formatChannelDeleteComponents(event, container, files); break;
    case ClientEvents.CHANNEL_UPDATE: Channels.formatChannelUpdateComponents(event, container, files); break;
    case ClientEvents.GUILD_BAN_ADD: Bans.formatGuildBanAddComponents(event, container, files); break;
    case ClientEvents.GUILD_BAN_REMOVE: Bans.formatGuildBanRemoveComponents(event, container, files); break;
    case ClientEvents.GUILD_MEMBER_ADD: Members.formatGuildMemberAddComponents(event, container, files); break;
    case ClientEvents.GUILD_MEMBER_REMOVE: Members.formatGuildMemberRemoveComponents(event, container, files); break;
    case ClientEvents.GUILD_MEMBER_UPDATE: Members.formatGuildMemberUpdateComponents(event, container, files); break;
    case ClientEvents.GUILD_ROLE_CREATE: Roles.formatGuildRoleCreateComponents(event, container, files); break;
    case ClientEvents.GUILD_ROLE_DELETE: Roles.formatGuildRoleDeleteComponents(event, container, files); break;
    case ClientEvents.GUILD_ROLE_UPDATE: Roles.formatGuildRoleUpdateComponents(event, container, files); break;
    case ClientEvents.MESSAGE_DELETE: Messages.formatMessageDeleteComponents(event, container, files); break;
    case ClientEvents.MESSAGE_DELETE_BULK: Messages.formatMessageDeleteBulkComponents(event, container, files); break;
    case ClientEvents.MESSAGE_UPDATE: Messages.formatMessageUpdateComponents(event, container, files); break;
    case ClientEvents.USERS_UPDATE: Users.formatUsersUpdateComponents(event, container, files); break;
    case ClientEvents.VOICE_STATE_UPDATE: Voice.formatVoiceStateUpdateComponents(event, container, files); break;
  }
  return {container, files};
}
