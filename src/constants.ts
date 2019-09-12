import { Constants } from 'detritus-client';

const {
  ChannelTypes,
  DetritusKeys,
  DiscordKeys,
  GuildExplicitContentFilterTypes,
  PresenceStatuses: Statuses,
  VerificationLevels,
} = Constants;


export const ChannelTypesText: {[key: number]: string} = Object.freeze({
  [ChannelTypes.GUILD_TEXT]: 'Guild Text',
  [ChannelTypes.DM]: 'Direct Message',
  [ChannelTypes.GUILD_VOICE]: 'Guild Voice',
  [ChannelTypes.GROUP_DM]: 'Direct Message Group',
  [ChannelTypes.GUILD_CATEGORY]: 'Guild Category',
  [ChannelTypes.GUILD_NEWS]: 'Guild News',
  [ChannelTypes.GUILD_STORE]: 'Guild Store',
  [ChannelTypes.GUILD_LFG_LISTINGS]: 'Guild LFG Listings',
});

export const DateOptions = Object.freeze({
  timeZone: 'America/New_York',
});

export const GuildExplicitContentFilterTypeTexts: {[key: string]: string} = Object.freeze({
  [GuildExplicitContentFilterTypes.DISABLED]: 'Disabled',
  [GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES]: 'No Roles',
  [GuildExplicitContentFilterTypes.ALL_MEMBERS]: 'Everyone',
});

export const PresenceStatusColors: {[key: string]: number} = Object.freeze({
  [Statuses.ONLINE]: 4437377,
  [Statuses.DND]: 15746887,
  [Statuses.IDLE]: 16426522,
  [Statuses.OFFLINE]: 7634829,
});

export const PresenceStatusTexts: {[key: string]: string} = Object.freeze({
  [Statuses.ONLINE]: 'Online',
  [Statuses.DND]: 'Do Not Disturb',
  [Statuses.IDLE]: 'Idle',
  [Statuses.OFFLINE]: 'Offline',
});

export const VerificationLevelTexts: {[key: string]: string} = Object.freeze({
  [VerificationLevels.NONE]: 'None',
  [VerificationLevels.LOW]: 'Low',
  [VerificationLevels.MEDIUM]: 'Medium',
  [VerificationLevels.HIGH]: 'High',
  [VerificationLevels.VERY_HIGH]: 'Very High',
});


export const PRESENCE_CLIENT_STATUS_KEYS = Object.freeze([
  DetritusKeys[DiscordKeys.DESKTOP],
  DetritusKeys[DiscordKeys.MOBILE],
  DetritusKeys[DiscordKeys.WEB],
]);
