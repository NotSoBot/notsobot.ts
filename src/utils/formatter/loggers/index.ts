import { ClientEvents } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed } from 'detritus-client/lib/utils';

import { Languages, Translator, getTranslatorForLanguage } from '../../i18n';

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
  const translator = getTranslatorForLanguage(options.language || Languages.ENGLISH);
  if (options.componentsV2) {
    return createLogPayloadComponents(event, translator);
  }
  return createLogPayloadEmbed(event, translator);
}


export function createLogPayloadEmbed(event: GuildLoggingEventItem, translator: Translator): LogPayload {
  const embed = new Embed();
  const files: LogPayloadFiles = [];
  switch (event.name) {
    case ClientEvents.CHANNEL_CREATE: Channels.formatChannelCreate(event, embed, files, translator); break;
    case ClientEvents.CHANNEL_DELETE: Channels.formatChannelDelete(event, embed, files, translator); break;
    case ClientEvents.CHANNEL_UPDATE: Channels.formatChannelUpdate(event, embed, files, translator); break;
    case ClientEvents.GUILD_BAN_ADD: Bans.formatGuildBanAdd(event, embed, files, translator); break;
    case ClientEvents.GUILD_BAN_REMOVE: Bans.formatGuildBanRemove(event, embed, files, translator); break;
    case ClientEvents.GUILD_MEMBER_ADD: Members.formatGuildMemberAdd(event, embed, files, translator); break;
    case ClientEvents.GUILD_MEMBER_REMOVE: Members.formatGuildMemberRemove(event, embed, files, translator); break;
    case ClientEvents.GUILD_MEMBER_UPDATE: Members.formatGuildMemberUpdate(event, embed, files, translator); break;
    case ClientEvents.GUILD_ROLE_CREATE: Roles.formatGuildRoleCreate(event, embed, files, translator); break;
    case ClientEvents.GUILD_ROLE_DELETE: Roles.formatGuildRoleDelete(event, embed, files, translator); break;
    case ClientEvents.GUILD_ROLE_UPDATE: Roles.formatGuildRoleUpdate(event, embed, files, translator); break;
    case ClientEvents.MESSAGE_DELETE: Messages.formatMessageDelete(event, embed, files, translator); break;
    case ClientEvents.MESSAGE_DELETE_BULK: Messages.formatMessageDeleteBulk(event, embed, files, translator); break;
    case ClientEvents.MESSAGE_UPDATE: Messages.formatMessageUpdate(event, embed, files, translator); break;
    case ClientEvents.USERS_UPDATE: Users.formatUsersUpdate(event, embed, files, translator); break;
    case ClientEvents.VOICE_STATE_UPDATE: Voice.formatVoiceStateUpdate(event, embed, files, translator); break;
  }
  return {embed: sanitizeEmbed(embed), files};
}


export function createLogPayloadComponents(event: GuildLoggingEventItem, translator: Translator): LogPayload {
  const container = new ComponentContainer();
  const files: LogPayloadFiles = [];
  switch (event.name) {
    case ClientEvents.CHANNEL_CREATE: Channels.formatChannelCreateComponents(event, container, files, translator); break;
    case ClientEvents.CHANNEL_DELETE: Channels.formatChannelDeleteComponents(event, container, files, translator); break;
    case ClientEvents.CHANNEL_UPDATE: Channels.formatChannelUpdateComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_BAN_ADD: Bans.formatGuildBanAddComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_BAN_REMOVE: Bans.formatGuildBanRemoveComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_MEMBER_ADD: Members.formatGuildMemberAddComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_MEMBER_REMOVE: Members.formatGuildMemberRemoveComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_MEMBER_UPDATE: Members.formatGuildMemberUpdateComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_ROLE_CREATE: Roles.formatGuildRoleCreateComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_ROLE_DELETE: Roles.formatGuildRoleDeleteComponents(event, container, files, translator); break;
    case ClientEvents.GUILD_ROLE_UPDATE: Roles.formatGuildRoleUpdateComponents(event, container, files, translator); break;
    case ClientEvents.MESSAGE_DELETE: Messages.formatMessageDeleteComponents(event, container, files, translator); break;
    case ClientEvents.MESSAGE_DELETE_BULK: Messages.formatMessageDeleteBulkComponents(event, container, files, translator); break;
    case ClientEvents.MESSAGE_UPDATE: Messages.formatMessageUpdateComponents(event, container, files, translator); break;
    case ClientEvents.USERS_UPDATE: Users.formatUsersUpdateComponents(event, container, files, translator); break;
    case ClientEvents.VOICE_STATE_UPDATE: Voice.formatVoiceStateUpdateComponents(event, container, files, translator); break;
  }
  return {container, files};
}
