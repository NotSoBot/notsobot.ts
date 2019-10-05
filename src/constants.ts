import { Constants } from 'detritus-client';
import { Tools } from 'detritus-utils';

const {
  ChannelTypes,
  DetritusKeys,
  DiscordKeys,
  GuildExplicitContentFilterTypes,
  Locales: DiscordLocales,
  Permissions,
  PresenceStatuses: Statuses,
  VerificationLevels,
} = Constants;

export { DiscordLocales };


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

export const CommandTypes = Tools.normalize({
  IMAGE: null,
  INFO: null,
  OWNER: null,
  SEARCH: null,
  SETTINGS: null,
  TOOLS: null,
});

export const DateOptions = Object.freeze({
  timeZone: 'America/New_York',
});

export const EmbedBrands = Object.freeze({
  DUCK_DUCK_GO: 'https://cdn.notsobot.com/brands/duck-duck-go.png',
  GOOGLE_GO: 'https://cdn.notsobot.com/brands/google-go.png',
  NOTSOBOT: 'https://cdn.notsobot.com/brands/notsobot.png?cache-bust-this-di',
  URBAN: 'https://cdn.notsobot.com/brands/urban-dictionary.png?cache-bust-this-di',
  WOLFRAM_ALPHA: 'https://cdn.notsobot.com/brands/wolfram-alpha.png',
  YOUTUBE: 'https://cdn.notsobot.com/brands/youtube.png',
});

export const EmbedColors = Object.freeze({
  DEFAULT: 8684933,
  ERROR: 15746887,
});

export const GoogleCardTypes = Tools.normalize({
  CALCULATOR: null,
  COMPLEMENTARY_RESULTS: null,
  CURRENCY: null,
  DEFINITION: null,
  KNOWLEDGE_RESULT: null,
  PEOPLE_ALSO_ASK: null,
  TIME: null,
  TRANSLATION: null,
  UNITS: null,
  UNKNOWN: null,
  WEATHER: null,
});

export const GOOGLE_CARD_TYPES_SUPPORTED = Object.freeze([
  GoogleCardTypes.CALCULATOR,
  GoogleCardTypes.CURRENCY,
  GoogleCardTypes.TIME,
  GoogleCardTypes.UNITS,
  GoogleCardTypes.WEATHER,
]);

export const GoogleLocales = Object.freeze({
  AMHARIC: 'am',
  ARABIC: 'ar',
  BASQUE: 'eu',
  BENGALI: 'bn',
  BULGARIAN: 'bg',
  CATALAN: 'ca',
  CHEROKEE: 'chr',
  CHINESE_SIMPLIFIED: 'zh-CN',
  CHINESE_TRADITIONAL: 'zh-TW',
  CROATIAN: 'hr',
  CZECH: 'cs',
  DANISH: 'da',
  DUTCH: 'nl',
  ENGLISH: 'en',
  ENGLISH_UK: 'en-GB',
  ESTONIAN: 'et',
  FILIPINO: 'fil',
  FINNISH: 'fi',
  FRENCH: 'fr',
  GERMAN: 'de',
  GREEK: 'el',
  GUJARATI: 'gu',
  HEBREW: 'iw',
  HINDI: 'hi',
  HUNGARIAIN: 'hu',
  ICELANDIC: 'is',
  INDONESIAN: 'id',
  ITALIAN: 'it',
  JAPANESE: 'ja',
  KANNADA: 'kn',
  KOREAN: 'ko',
  LATVIAN: 'lv',
  LITHUANIAN: 'lt',
  MALAY: 'ms',
  MALAYALAM: 'ml',
  MARATHI: 'mr',
  NORWEGIAN: 'no',
  POLISH: 'pl',
  PORTUGUESE_BRAZIL: 'pt-BR',
  PORTUGUESE_PORTUGAL: 'pt-PT',
  ROMANIAN: 'ro',
  RUSSIAN: 'ru',
  SERBIAN: 'sr',
  SLOVAK: 'sk',
  SLOVENIAN: 'sl',
  SPANISH: 'es',
  SWAHILI: 'sw',
  SWEDISH: 'sv',
  TAMIL: 'ta',
  TELUGU: 'te',
  THAI: 'th',
  TURKISH: 'tr',
  URDU: 'ur',
  UKRAINIAN: 'uk',
  VIETNAMESE: 'vi',
  WELSH: 'cy',
});

export const GOOGLE_LOCALES = Object.freeze(Object.values(GoogleLocales));

export const GoogleLocalesText = Object.freeze({
  [GoogleLocales.AMHARIC]: 'Amharic',
  [GoogleLocales.ARABIC]: 'Arabic',
  [GoogleLocales.BASQUE]: 'Basque',
  [GoogleLocales.BENGALI]: 'Bengali',
  [GoogleLocales.BULGARIAN]: 'Bulgarian',
  [GoogleLocales.CATALAN]: 'Catalan',
  [GoogleLocales.CHEROKEE]: 'Cherokee',
  [GoogleLocales.CHINESE_SIMPLIFIED]: 'Chinese (Simplified)',
  [GoogleLocales.CHINESE_TRADITIONAL]: 'Chinese (Traditional)',
  [GoogleLocales.CROATIAN]: 'Croatian',
  [GoogleLocales.CZECH]: 'Czech',
  [GoogleLocales.DANISH]: 'Danish',
  [GoogleLocales.DUTCH]: 'Dutch',
  [GoogleLocales.ENGLISH]: 'English (US)',
  [GoogleLocales.ENGLISH_UK]: 'English (UK)',
  [GoogleLocales.ESTONIAN]: 'Estonian',
  [GoogleLocales.FILIPINO]: 'Filipino',
  [GoogleLocales.FINNISH]: 'Finnish',
  [GoogleLocales.FRENCH]: 'French',
  [GoogleLocales.GERMAN]: 'German',
  [GoogleLocales.GREEK]: 'Greek',
  [GoogleLocales.GUJARATI]: 'Gujarati',
  [GoogleLocales.HEBREW]: 'Hebrew',
  [GoogleLocales.HINDI]: 'Hindi',
  [GoogleLocales.HUNGARIAIN]: 'Hungarian',
  [GoogleLocales.ICELANDIC]: 'Icelandic',
  [GoogleLocales.INDONESIAN]: 'Indonesian',
  [GoogleLocales.ITALIAN]: 'Italian',
  [GoogleLocales.JAPANESE]: 'Japanese',
  [GoogleLocales.KANNADA]: 'Kannada',
  [GoogleLocales.KOREAN]: 'Korean',
  [GoogleLocales.LATVIAN]: 'Latvian',
  [GoogleLocales.LITHUANIAN]: 'Lithuanian',
  [GoogleLocales.MALAYALAM]: 'Malayalam',
  [GoogleLocales.MALAY]: 'Malay',
  [GoogleLocales.MARATHI]: 'Marathi',
  [GoogleLocales.NORWEGIAN]: 'Norwegian',
  [GoogleLocales.POLISH]: 'Polish',
  [GoogleLocales.PORTUGUESE_BRAZIL]: 'Portuguese (Brazil)',
  [GoogleLocales.PORTUGUESE_PORTUGAL]: 'Portuguese (Portugal)',
  [GoogleLocales.ROMANIAN]: 'Romanian',
  [GoogleLocales.RUSSIAN]: 'Russian',
  [GoogleLocales.SERBIAN]: 'Serbian',
  [GoogleLocales.SLOVAK]: 'Slovak',
  [GoogleLocales.SLOVENIAN]: 'Slovenian',
  [GoogleLocales.SPANISH]: 'Spanish',
  [GoogleLocales.SWAHILI]: 'Swahili',
  [GoogleLocales.SWEDISH]: 'Swedish',
  [GoogleLocales.TAMIL]: 'Tamil',
  [GoogleLocales.TELUGU]: 'Telugu',
  [GoogleLocales.THAI]: 'Thai',
  [GoogleLocales.TURKISH]: 'Turkish',
  [GoogleLocales.URDU]: 'Urdu',
  [GoogleLocales.VIETNAMESE]: 'Vietnamese',
  [GoogleLocales.WELSH]: 'Welsh',
});

export const GoogleLocaleFromDiscord = Object.freeze({
  [DiscordLocales.ENGLISH_US]: GoogleLocales.ENGLISH,
  [DiscordLocales.SPANISH]: GoogleLocales.SPANISH,
  [DiscordLocales.SWEDISH]: GoogleLocales.SWEDISH,
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

export const YoutubeResultTypes = Object.freeze({
  CHANNEL: 0,
  VIDEO: 1,
});

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
