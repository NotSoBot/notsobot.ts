import { Constants } from 'detritus-client';
import { Tools } from 'detritus-utils';

const {
  ChannelTypes,
  DetritusKeys,
  DiscordKeys,
  GuildExplicitContentFilterTypes,
  Permissions,
  PresenceStatuses: Statuses,
  VerificationLevels,
} = Constants;


export const BooleanEmojis = Object.freeze({
  NO: '❌',
  YES: '✅',
});

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

export const PermissionsKeys = Object.freeze(Tools.normalize(Object.assign({}, Permissions)));

export const PermissionsText = Object.freeze({
  [PermissionsKeys.ADD_REACTIONS]: 'Add Reactions',
  [PermissionsKeys.ADMINISTRATOR]: 'Administrator',
  [PermissionsKeys.ATTACH_FILES]: 'Attach Files',
  [PermissionsKeys.BAN_MEMBERS]: 'Ban Members',
  [PermissionsKeys.CHANGE_NICKNAME]: 'Change Nickname',
  [PermissionsKeys.CHANGE_NICKNAMES]: 'Change Nicknames',
  [PermissionsKeys.CONNECT]: 'Connect',
  [PermissionsKeys.CREATE_INSTANT_INVITE]: 'Create Instant Invite',
  [PermissionsKeys.DEAFEN_MEMBERS]: 'Deafen Members',
  [PermissionsKeys.EMBED_LINKS]: 'Embed Links',
  [PermissionsKeys.KICK_MEMBERS]: 'Kick Members',
  [PermissionsKeys.MANAGE_CHANNELS]: 'Manage Channels',
  [PermissionsKeys.MANAGE_EMOJIS]: 'Manage Emojis',
  [PermissionsKeys.MANAGE_GUILD]: 'Manage Guild',
  [PermissionsKeys.MANAGE_MESSAGES]: 'Manage Messages',
  [PermissionsKeys.MANAGE_ROLES]: 'Manage Roles',
  [PermissionsKeys.MANAGE_WEBHOOKS]: 'Manage Webhooks',
  [PermissionsKeys.MENTION_EVERYONE]: 'Mention Everyone',
  [PermissionsKeys.MOVE_MEMBERS]: 'Move Members',
  [PermissionsKeys.MUTE_MEMBERS]: 'Mute Members',
  [PermissionsKeys.PRIORITY_SPEAKER]: 'Priority Speaker',
  [PermissionsKeys.READ_MESSAGE_HISTORY]: 'Read Message History',
  [PermissionsKeys.SEND_MESSAGES]: 'Send Messages',
  [PermissionsKeys.SEND_TTS_MESSAGES]: 'Text-To-Speech',
  [PermissionsKeys.SPEAK]: 'Speak',
  [PermissionsKeys.STREAM]: 'Go Live',
  [PermissionsKeys.USE_EXTERNAL_EMOJIS]: 'Use External Emojis',
  [PermissionsKeys.USE_VAD]: 'Voice Auto Detect',
  [PermissionsKeys.VIEW_AUDIT_LOG]: 'View Audit Logs',
  [PermissionsKeys.VIEW_CHANNEL]: 'View Channel',
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

export const LOCALES = Object.freeze([
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'en-gb',
  'en-us',
  'es-es',
  'fi',
  'fr',
  'hr',
  'hu',
  'it',
  'ja',
  'ko',
  'lt',
  'nl',
  'no',
  'pl',
  'pt-br',
  'ro',
  'ru',
  'sv-se',
  'th',
  'tr',
  'uk',
  'vi',
  'zh-cn',
  'zh-tw',
]);

export const PERMISSIONS_KEYS_ADMIN = Object.freeze([
  PermissionsKeys.ADMINISTRATOR,
  PermissionsKeys.BAN_MEMBERS,
  PermissionsKeys.CHANGE_NICKNAMES,
  PermissionsKeys.KICK_MEMBERS,
  PermissionsKeys.MANAGE_CHANNELS,
  PermissionsKeys.MANAGE_EMOJIS,
  PermissionsKeys.MANAGE_GUILD,
  PermissionsKeys.MANAGE_MESSAGES,
  PermissionsKeys.MANAGE_ROLES,
  PermissionsKeys.MANAGE_WEBHOOKS,
  PermissionsKeys.VIEW_AUDIT_LOG,
]);

export const PERMISSIONS_KEYS_TEXT = Object.freeze([
  PermissionsKeys.ADD_REACTIONS,
  PermissionsKeys.ATTACH_FILES,
  PermissionsKeys.CREATE_INSTANT_INVITE,
  PermissionsKeys.EMBED_LINKS,
  PermissionsKeys.MENTION_EVERYONE,
  PermissionsKeys.READ_MESSAGE_HISTORY,
  PermissionsKeys.SEND_MESSAGES,
  PermissionsKeys.SEND_TTS_MESSAGES,
  PermissionsKeys.USE_EXTERNAL_EMOJIS,
  PermissionsKeys.VIEW_CHANNEL,
]);

export const PERMISSIONS_KEYS_VOICE = Object.freeze([
  PermissionsKeys.CONNECT,
  PermissionsKeys.CREATE_INSTANT_INVITE,
  PermissionsKeys.DEAFEN_MEMBERS,
  PermissionsKeys.MOVE_MEMBERS,
  PermissionsKeys.MUTE_MEMBERS,
  PermissionsKeys.PRIORITY_SPEAKER,
  PermissionsKeys.SPEAK,
  PermissionsKeys.STREAM,
  PermissionsKeys.USE_VAD,
  PermissionsKeys.VIEW_CHANNEL,
]);

export const PRESENCE_CLIENT_STATUS_KEYS = Object.freeze([
  DetritusKeys[DiscordKeys.DESKTOP],
  DetritusKeys[DiscordKeys.MOBILE],
  DetritusKeys[DiscordKeys.WEB],
]);
