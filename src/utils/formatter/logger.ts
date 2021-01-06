import { Collections, GatewayClientEvents, Structures } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';


export type GuildLoggingEventItemAudits = [Structures.AuditLog, ...Array<Structures.AuditLog>];

export interface GuildLoggingEventItemPartial {
  audits?: GuildLoggingEventItemAudits,
  happened: number,
}

export interface GuildLoggingEventItemGuildBanAdd extends GuildLoggingEventItemPartial {
  name: ClientEvents.GUILD_BAN_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd,
}

export interface GuildLoggingEventItemGuildBanRemove extends GuildLoggingEventItemPartial {
  name: ClientEvents.GUILD_BAN_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove,
}

export interface GuildLoggingEventItemGuildMemberAdd extends GuildLoggingEventItemPartial {
  from?: 'desktop',
  name: ClientEvents.GUILD_MEMBER_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd,
}

export interface GuildLoggingEventItemGuildMemberRemove extends GuildLoggingEventItemPartial {
  name: ClientEvents.GUILD_MEMBER_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove,
}

export interface GuildLoggingEventItemGuildMemberUpdate extends GuildLoggingEventItemPartial {
  cached: {
    deaf: boolean,
    hoistedRole: null | string,
    mute: boolean,
    nick: null | string,
    premiumSince: Date | null,
    roles: Array<string>,
  },
  name: ClientEvents.GUILD_MEMBER_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate,
}

export interface GuildLoggingEventItemGuildRoleCreate extends GuildLoggingEventItemPartial {
  cached: {
    color: number,
    hoist: boolean,
    mentionable: boolean,
    name: string,
    permissions: number,
    position: number,
  },
  name: ClientEvents.GUILD_ROLE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate,
}

export interface GuildLoggingEventItemGuildRoleDelete extends GuildLoggingEventItemPartial {
  name: ClientEvents.GUILD_ROLE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete,
}

export interface GuildLoggingEventItemGuildRoleUpdate extends GuildLoggingEventItemPartial {
  cached: {
    color: number,
    hoist: boolean,
    mentionable: boolean,
    name: string,
    permissions: number,
    position: number,
  },
  name: ClientEvents.GUILD_ROLE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate,
}

/*
export interface GuildLoggingEventItemMessageCreate extends GuildLoggingEventItemPartial {
  cached: {
    attachments: Collections.BaseCollection<string, Structures.Attachment>,
    content: string,
    embeds: Collections.BaseCollection<number, Structures.MessageEmbed>,
    flags: number,
    mentions: Collections.BaseCollection<string, Structures.User>,
  },
  name: ClientEvents.MESSAGE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate,
}
*/

export interface GuildLoggingEventItemMessageDelete extends GuildLoggingEventItemPartial {
  name: ClientEvents.MESSAGE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete,
}

export interface GuildLoggingEventItemMessageDeleteBulk extends GuildLoggingEventItemPartial {
  name: ClientEvents.MESSAGE_DELETE_BULK,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk,
}

export interface GuildLoggingEventItemMessageUpdate extends GuildLoggingEventItemPartial {
  cached: {
    attachments: Collections.BaseCollection<string, Structures.Attachment>,
    content: string,
    embeds: Collections.BaseCollection<number, Structures.MessageEmbed>,
    flags: number,
    mentionEveryone: boolean,
    mentionRoles: Collections.BaseCollection<string, null | Structures.Role>,
    mentions: Collections.BaseCollection<string, Structures.User>,
  },
  name: ClientEvents.MESSAGE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate,
}

export interface GuildLoggingEventItemUsersUpdate extends GuildLoggingEventItemPartial {
  cached: Structures.User,
  name: ClientEvents.USERS_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate,
}

export interface GuildLoggingEventItemVoiceStateUpdate extends GuildLoggingEventItemPartial {
  cached: Structures.VoiceState,
  name: ClientEvents.VOICE_STATE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate,
}

export type GuildLoggingEventItem = (
  GuildLoggingEventItemGuildBanAdd |
  GuildLoggingEventItemGuildBanRemove |
  GuildLoggingEventItemGuildMemberAdd |
  GuildLoggingEventItemGuildMemberRemove |
  GuildLoggingEventItemGuildMemberUpdate |
  GuildLoggingEventItemGuildRoleCreate |
  GuildLoggingEventItemGuildRoleDelete |
  GuildLoggingEventItemGuildRoleUpdate |
  GuildLoggingEventItemMessageDelete |
  GuildLoggingEventItemMessageDeleteBulk |
  GuildLoggingEventItemMessageUpdate |
  GuildLoggingEventItemUsersUpdate |
  GuildLoggingEventItemVoiceStateUpdate
);
