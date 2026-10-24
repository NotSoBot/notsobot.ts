import { GatewayClientEvents, Structures } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { ComponentContainer, Embed } from 'detritus-client/lib/utils';

import type { RestResponsesRaw } from '../../../api/types';
import type { UserAvatarDecorationStored } from '../../../stores/useravatardecorations';
import type { Languages } from '../../i18n';


export type ClientStatusType = 'desktop' | 'mobile' | 'web';

// logs the bot posts itself from its commands, warnings aren't discord actions so there's no gateway event or audit log
export enum GuildLoggingCustomEvents {
  GUILD_WARNING_ADD = 'guildWarningAdd',
  GUILD_WARNING_REMOVE = 'guildWarningRemove',
  GUILD_WARNINGS_CLEAR = 'guildWarningsClear',
}

export type GuildLoggingEventItemAudits = [Structures.AuditLog, ...Array<Structures.AuditLog>];

export type GuildLoggingEventItem = {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    channel: Structures.Channel,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.CHANNEL_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelCreate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    channel: Structures.Channel,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.CHANNEL_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    channel: Structures.Channel,
    old: Structures.Channel,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.CHANNEL_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.ChannelUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_BAN_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanAdd,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_BAN_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildBanRemove,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    from?: ClientStatusType,
    memberCount: number,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_ADD,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberAdd,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    memberCount: number,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_REMOVE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberRemove,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    avatars?: {
      current?: {filename: string, value: Buffer},
      old?: {filename: string, value: Buffer},
    },
    member: Structures.Member,
    old: Structures.Member,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_MEMBER_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildMemberUpdate,
} | /*{
  audits?: GuildLoggingEventItemAudits,
  cached: {
    attachments: Collections.BaseCollection<string, Structures.Attachment>,
    content: string,
    embeds: Collections.BaseCollection<number, Structures.MessageEmbed>,
    flags: number,
    mentions: Collections.BaseCollection<string, Structures.User>,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageCreate,
} | */{
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_DELETE_BULK,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageDeleteBulk,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    message: Structures.Message,
    old: Structures.Message | null,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.MESSAGE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.MessageUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    avatars?: {
      current?: {filename: string, value: Buffer},
      old?: {filename: string, value: Buffer},
    },
    avatarDecorations?: {current?: UserAvatarDecorationStored, old?: UserAvatarDecorationStored},
    old: Structures.User,
    user: Structures.User,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.USERS_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.UsersUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    old: Structures.VoiceState | null,
    voiceState: Structures.VoiceState,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.VOICE_STATE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.VoiceStateUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    role: Structures.Role,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_ROLE_CREATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleCreate,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_ROLE_DELETE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleDelete,
} | {
  audits?: GuildLoggingEventItemAudits,
  cached: {
    icons?: {
      current?: {filename: string, value: Buffer},
      old?: {filename: string, value: Buffer},
    },
    old: Structures.Role,
    role: Structures.Role,
  },
  guildId: string,
  happened: number,
  name: ClientEvents.GUILD_ROLE_UPDATE,
  payload: GatewayClientEvents.ClusterEvent & GatewayClientEvents.GuildRoleUpdate,
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: GuildLoggingCustomEvents.GUILD_WARNING_ADD,
  payload: {
    // the member's warnings, counting this one
    counts: RestResponsesRaw.GuildWarningCounts,
    moderator: Structures.User,
    user: Structures.User,
    warning: RestResponsesRaw.GuildWarning,
  },
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: GuildLoggingCustomEvents.GUILD_WARNING_REMOVE,
  payload: {
    moderator: Structures.User,
    // only when cached, the warned user might have left
    user: Structures.User | null,
    warning: RestResponsesRaw.GuildWarning,
  },
} | {
  audits?: GuildLoggingEventItemAudits,
  guildId: string,
  happened: number,
  name: GuildLoggingCustomEvents.GUILD_WARNINGS_CLEAR,
  payload: {
    // how many got deleted
    count: number,
    moderator: Structures.User,
    user: Structures.User,
  },
};

export type GuildLoggingEventChannelCreate = Extract<GuildLoggingEventItem, {name: ClientEvents.CHANNEL_CREATE}>;
export type GuildLoggingEventChannelDelete = Extract<GuildLoggingEventItem, {name: ClientEvents.CHANNEL_DELETE}>;
export type GuildLoggingEventChannelUpdate = Extract<GuildLoggingEventItem, {name: ClientEvents.CHANNEL_UPDATE}>;
export type GuildLoggingEventGuildBanAdd = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_BAN_ADD}>;
export type GuildLoggingEventGuildBanRemove = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_BAN_REMOVE}>;
export type GuildLoggingEventGuildMemberAdd = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_MEMBER_ADD}>;
export type GuildLoggingEventGuildMemberRemove = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_MEMBER_REMOVE}>;
export type GuildLoggingEventGuildMemberUpdate = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_MEMBER_UPDATE}>;
export type GuildLoggingEventMessageDelete = Extract<GuildLoggingEventItem, {name: ClientEvents.MESSAGE_DELETE}>;
export type GuildLoggingEventMessageDeleteBulk = Extract<GuildLoggingEventItem, {name: ClientEvents.MESSAGE_DELETE_BULK}>;
export type GuildLoggingEventMessageUpdate = Extract<GuildLoggingEventItem, {name: ClientEvents.MESSAGE_UPDATE}>;
export type GuildLoggingEventGuildRoleCreate = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_ROLE_CREATE}>;
export type GuildLoggingEventGuildRoleDelete = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_ROLE_DELETE}>;
export type GuildLoggingEventGuildRoleUpdate = Extract<GuildLoggingEventItem, {name: ClientEvents.GUILD_ROLE_UPDATE}>;
export type GuildLoggingEventUsersUpdate = Extract<GuildLoggingEventItem, {name: ClientEvents.USERS_UPDATE}>;
export type GuildLoggingEventVoiceStateUpdate = Extract<GuildLoggingEventItem, {name: ClientEvents.VOICE_STATE_UPDATE}>;
export type GuildLoggingEventGuildWarningAdd = Extract<GuildLoggingEventItem, {name: GuildLoggingCustomEvents.GUILD_WARNING_ADD}>;
export type GuildLoggingEventGuildWarningRemove = Extract<GuildLoggingEventItem, {name: GuildLoggingCustomEvents.GUILD_WARNING_REMOVE}>;
export type GuildLoggingEventGuildWarningsClear = Extract<GuildLoggingEventItem, {name: GuildLoggingCustomEvents.GUILD_WARNINGS_CLEAR}>;
export type GuildLoggingEventModeration = GuildLoggingEventGuildWarningAdd | GuildLoggingEventGuildWarningRemove | GuildLoggingEventGuildWarningsClear;

export type LogPayloadFiles = Array<{filename: string, value: any}>;

export type LogPayload = {
  embed: Embed,
  files: LogPayloadFiles,
} | {
  container: ComponentContainer,
  files: LogPayloadFiles,
};

export interface LogPayloadOptions {
  componentsV2?: boolean,
  language?: Languages,
}
