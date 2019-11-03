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

type Permissions = Constants.Permissions;
type ChannelTypes = Constants.ChannelTypes;


export const MOMENT_FORMAT = 'y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]';

export enum BooleanEmojis {
  NO = '❌',
  YES = '✅',
};

export const ChannelTypesText: {[key in Constants.ChannelTypes]: string} = Object.freeze({
  [ChannelTypes.BASE]: 'Base Channel',
  [ChannelTypes.GUILD_TEXT]: 'Guild Text',
  [ChannelTypes.DM]: 'Direct Message',
  [ChannelTypes.GUILD_VOICE]: 'Guild Voice',
  [ChannelTypes.GROUP_DM]: 'Direct Message Group',
  [ChannelTypes.GUILD_CATEGORY]: 'Guild Category',
  [ChannelTypes.GUILD_NEWS]: 'Guild News',
  [ChannelTypes.GUILD_STORE]: 'Guild Store',
  [ChannelTypes.GUILD_LFG_LISTINGS]: 'Guild LFG Listings',
  [ChannelTypes.LFG_GROUP_DM]: 'LFG Direct Message Group',
});

export const CommandTypes = Tools.normalize({
  FUN: null,
  IMAGE: null,
  INFO: null,
  MODERATION: null,
  OWNER: null,
  SAY: null,
  SEARCH: null,
  SETTINGS: null,
  TOOLS: null,
  UTILS: null,
});

export const DateMomentOptions = Object.freeze({
  trim: 'both mid',
});

export const DateOptions = Object.freeze({
  timeZone: 'America/New_York',
});

export enum EmbedBrands {
  DUCK_DUCK_GO = 'https://cdn.notsobot.com/brands/duck-duck-go.png',
  GOOGLE_GO = 'https://cdn.notsobot.com/brands/google-go.png',
  NOTSOBOT = 'https://cdn.notsobot.com/brands/notsobot.png?cache-bust-this-di',
  URBAN = 'https://cdn.notsobot.com/brands/urban-dictionary.png?cache-bust-this-di',
  WOLFRAM_ALPHA = 'https://cdn.notsobot.com/brands/wolfram-alpha.png',
  YOUTUBE = 'https://cdn.notsobot.com/brands/youtube.png',
};

export enum EmbedColors {
  DEFAULT = 8684933,
  ERROR = 15746887,
};

export enum GoogleCardTypes {
  CALCULATOR = 'CALCULATOR',
  COMPLEMENTARY_RESULTS = 'COMPLEMENTARY_RESULTS',
  CURRENCY = 'CURRENCY',
  DEFINITION = 'DEFINITION',
  KNOWLEDGE_RESULT = 'KNOWLEDGE_RESULT',
  PEOPLE_ALSO_ASK = 'PEOPLE_ALSO_ASK',
  TIME = 'TIME',
  TRANSLATION = 'TRANSLATION',
  UNITS = 'UNITS',
  UNKNOWN = 'UNKNOWN',
  WEATHER = 'WEATHER',
}

export const GOOGLE_CARD_TYPES_SUPPORTED = Object.freeze([
  GoogleCardTypes.CALCULATOR,
  GoogleCardTypes.CURRENCY,
  GoogleCardTypes.TIME,
  GoogleCardTypes.UNITS,
  GoogleCardTypes.WEATHER,
]);

export enum GoogleLocales {
  AFRIKAANS = 'af',
  ALBANIAN = 'sq',
  AMHARIC = 'am',
  ARABIC = 'ar',
  ARMENIAN = 'hy',
  AZERBAIJANI = 'az',
  BASQUE = 'eu',
  BELARUSIAN = 'be',
  BENGALI = 'bn',
  BOSNIAN = 'bs',
  BULGARIAN = 'bg',
  CATALAN = 'ca',
  CEBUANO = 'ceb',
  CHINESE_SIMPLIFIED = 'zh-CN',
  CHINESE_TRADITIONAL = 'zh-TW',
  CORSICAN = 'co',
  CROATIAN = 'hr',
  CZECH = 'cs',
  DANISH = 'da',
  DUTCH = 'nl',
  ENGLISH = 'en',
  ESPERANTO = 'eo',
  ESTONIAN = 'et',
  FILIPINO = 'fil',
  FINNISH = 'fi',
  FRENCH = 'fr',
  FRISIAN = 'fy',
  GALICIAN = 'gl',
  GEORGIAN = 'ka',
  GERMAN = 'de',
  GREEK = 'el',
  GUJARATI = 'gu',
  HAITIAN_CREOLE = 'ht',
  HAUSA = 'ha',
  HAWAIIAN = 'haw',
  HEBREW = 'iw',
  HINDI = 'hi',
  HMONG = 'hmn',
  HUNGARIAN = 'hu',
  ICELANDIC = 'is',
  IGBO = 'ig',
  INDONESIAN = 'id',
  IRISH = 'ga',
  ITALIAN = 'it',
  JAPANESE = 'ja',
  JAVANESE = 'jw',
  KANNADA = 'kn',
  KAZAKH = 'kk',
  KHMER = 'km',
  KOREAN = 'ko',
  KURDISH = 'ku',
  KYRGYZ = 'ky',
  LAO = 'lo',
  LATIN = 'la',
  LATVIAN = 'lv',
  LITHUANIAN = 'lt',
  LUXEMBOURGISH = 'lb',
  MACEDONIAN = 'mk',
  MALAGASY = 'mg',
  MALAY = 'ms',
  MALAYALAM = 'ml',
  MALTESE = 'mt',
  MAORI = 'mi',
  MARATHI = 'mr',
  MONGOLIAN = 'mn',
  MYANMAR_BURMESE = 'my',
  NEPALI = 'ne',
  NORWEGIAN = 'no',
  NYANJA_CHICHEWA = 'ny',
  PASHTO = 'ps',
  PERSIAN = 'fa',
  POLISH = 'pl',
  PORTUGUESE_BRAZIL = 'pt-BR',
  PORTUGUESE_PORTUGAL = 'pt-PT',
  PUNJABI = 'pa',
  ROMANIAN = 'ro',
  RUSSIAN = 'ru',
  SAMOAN = 'sm',
  SCOTS_GAELIC = 'gd',
  SERBIAN = 'sr',
  SESOTHO = 'st',
  SHONA = 'sn',
  SINDHI = 'sd',
  SINHALA_SINHALESE = 'si',
  SLOVAK = 'sk',
  SLOVENIAN = 'sl',
  SOMALI = 'so',
  SPANISH = 'es',
  SUNDANESE = 'su',
  SWAHILI = 'sw',
  SWEDISH = 'sv',
  TAGALOG_FILIPINO = 'tl',
  TAJIK = 'tg',
  TAMIL = 'ta',
  TELUGU = 'te',
  THAI = 'th',
  TURKISH = 'tr',
  UKRAINIAN = 'uk',
  URDU = 'ur',
  UZBEK = 'uz',
  VIETNAMESE = 'vi',
  WELSH = 'cy',
  XHOSA = 'xh',
  YIDDISH = 'yi',
  YORUBA = 'yo',
  ZULU = 'zu',
};

export const GOOGLE_LOCALES = Object.freeze(Object.values(GoogleLocales));

export const GoogleLocalesText = Object.freeze({
  [GoogleLocales.AFRIKAANS]: 'Afrikaans',
  [GoogleLocales.ALBANIAN]: 'Albanian',
  [GoogleLocales.AMHARIC]: 'Amharic',
  [GoogleLocales.ARABIC]: 'Arabic',
  [GoogleLocales.ARMENIAN]: 'Armenian',
  [GoogleLocales.AZERBAIJANI]: 'Azerbaijani',
  [GoogleLocales.BASQUE]: 'Basque',
  [GoogleLocales.BELARUSIAN]: 'Belarusian',
  [GoogleLocales.BENGALI]: 'Bengali',
  [GoogleLocales.BOSNIAN]: 'Bosnian',
  [GoogleLocales.BULGARIAN]: 'Bulgarian',
  [GoogleLocales.CATALAN]: 'Catalan',
  [GoogleLocales.CEBUANO]: 'Cebuano',
  [GoogleLocales.CHINESE_SIMPLIFIED]: 'Chinese, Simplified',
  [GoogleLocales.CHINESE_TRADITIONAL]: 'Chinese, Traditional',
  [GoogleLocales.CORSICAN]: 'Corsican',
  [GoogleLocales.CROATIAN]: 'Croatian',
  [GoogleLocales.CZECH]: 'Czech',
  [GoogleLocales.DANISH]: 'Danish',
  [GoogleLocales.DUTCH]: 'Dutch',
  [GoogleLocales.ENGLISH]: 'English',
  [GoogleLocales.ESPERANTO]: 'Esperanto',
  [GoogleLocales.ESTONIAN]: 'Estonian',
  [GoogleLocales.FILIPINO]: 'Filipino',
  [GoogleLocales.FINNISH]: 'Finnish',
  [GoogleLocales.FRENCH]: 'French',
  [GoogleLocales.FRISIAN]: 'Frisian',
  [GoogleLocales.GALICIAN]: 'Galician',
  [GoogleLocales.GEORGIAN]: 'Georgian',
  [GoogleLocales.GERMAN]: 'German',
  [GoogleLocales.GREEK]: 'Greek',
  [GoogleLocales.GUJARATI]: 'Gujarati',
  [GoogleLocales.HAITIAN_CREOLE]: 'Haitian Creole',
  [GoogleLocales.HAUSA]: 'Hausa',
  [GoogleLocales.HAWAIIAN]: 'Hawaiian',
  [GoogleLocales.HEBREW]: 'Hebrew',
  [GoogleLocales.HINDI]: 'Hindi',
  [GoogleLocales.HMONG]: 'Hmong',
  [GoogleLocales.HUNGARIAN]: 'Hungarian',
  [GoogleLocales.ICELANDIC]: 'Icelandic',
  [GoogleLocales.IGBO]: 'Igbo',
  [GoogleLocales.INDONESIAN]: 'Indonesian',
  [GoogleLocales.IRISH]: 'Irish',
  [GoogleLocales.ITALIAN]: 'Italian',
  [GoogleLocales.JAPANESE]: 'Japanese',
  [GoogleLocales.JAVANESE]: 'Javanese',
  [GoogleLocales.KANNADA]: 'Kannada',
  [GoogleLocales.KAZAKH]: 'Kazakh',
  [GoogleLocales.KHMER]: 'Khmer',
  [GoogleLocales.KOREAN]: 'Korean',
  [GoogleLocales.KURDISH]: 'Kurdish',
  [GoogleLocales.KYRGYZ]: 'Kyrgyz',
  [GoogleLocales.LAO]: 'Lao',
  [GoogleLocales.LATIN]: 'Latin',
  [GoogleLocales.LATVIAN]: 'Latvian',
  [GoogleLocales.LITHUANIAN]: 'Lithuanian',
  [GoogleLocales.LUXEMBOURGISH]: 'Luxembourgish',
  [GoogleLocales.MACEDONIAN]: 'Macedonian',
  [GoogleLocales.MALAGASY]: 'Malagasy',
  [GoogleLocales.MALAY]: 'Malay',
  [GoogleLocales.MALAYALAM]: 'Malayalam',
  [GoogleLocales.MALTESE]: 'Maltese',
  [GoogleLocales.MAORI]: 'Maori',
  [GoogleLocales.MARATHI]: 'Marathi',
  [GoogleLocales.MONGOLIAN]: 'Mongolian',
  [GoogleLocales.MYANMAR_BURMESE]: 'Myanmar, Burmese',
  [GoogleLocales.NEPALI]: 'Nepali',
  [GoogleLocales.NORWEGIAN]: 'Norwegian',
  [GoogleLocales.NYANJA_CHICHEWA]: 'Nyanja, Chichewa',
  [GoogleLocales.PASHTO]: 'Pashto',
  [GoogleLocales.PERSIAN]: 'Persian',
  [GoogleLocales.POLISH]: 'Polish',
  [GoogleLocales.PORTUGUESE_BRAZIL]: 'Portuguese, Brazil',
  [GoogleLocales.PORTUGUESE_PORTUGAL]: 'Portuguese, Portugal',
  [GoogleLocales.PUNJABI]: 'Punjabi',
  [GoogleLocales.ROMANIAN]: 'Romanian',
  [GoogleLocales.RUSSIAN]: 'Russian',
  [GoogleLocales.SAMOAN]: 'Samoan',
  [GoogleLocales.SCOTS_GAELIC]: 'Scots Gaelic',
  [GoogleLocales.SERBIAN]: 'Serbian',
  [GoogleLocales.SESOTHO]: 'Sesotho',
  [GoogleLocales.SHONA]: 'Shona',
  [GoogleLocales.SINDHI]: 'Sindhi',
  [GoogleLocales.SINHALA_SINHALESE]: 'Sinhala, Sinhalese',
  [GoogleLocales.SLOVAK]: 'Slovak',
  [GoogleLocales.SLOVENIAN]: 'Slovenian',
  [GoogleLocales.SOMALI]: 'Somali',
  [GoogleLocales.SPANISH]: 'Spanish',
  [GoogleLocales.SUNDANESE]: 'Sundanese',
  [GoogleLocales.SWAHILI]: 'Swahili',
  [GoogleLocales.SWEDISH]: 'Swedish',
  [GoogleLocales.TAGALOG_FILIPINO]: 'Tagalog, Filipino',
  [GoogleLocales.TAJIK]: 'Tajik',
  [GoogleLocales.TAMIL]: 'Tamil',
  [GoogleLocales.TELUGU]: 'Telugu',
  [GoogleLocales.THAI]: 'Thai',
  [GoogleLocales.TURKISH]: 'Turkish',
  [GoogleLocales.UKRAINIAN]: 'Ukrainian',
  [GoogleLocales.URDU]: 'Urdu',
  [GoogleLocales.UZBEK]: 'Uzbek',
  [GoogleLocales.VIETNAMESE]: 'Vietnamese',
  [GoogleLocales.WELSH]: 'Welsh',
  [GoogleLocales.XHOSA]: 'Xhosa',
  [GoogleLocales.YIDDISH]: 'Yiddish',
  [GoogleLocales.YORUBA]: 'Yoruba',
  [GoogleLocales.ZULU]: 'Zulu',
});

export const GoogleLocaleFromDiscord = Object.freeze({
  [Constants.Locales.ENGLISH_US]: GoogleLocales.ENGLISH,
  [Constants.Locales.ENGLISH_GB]: GoogleLocales.ENGLISH,
  [Constants.Locales.SPANISH]: GoogleLocales.SPANISH,
  [Constants.Locales.SWEDISH]: GoogleLocales.SWEDISH,
});

export enum GuildBlacklistTypes {
  CHANNEL = 'channel',
  MEMBER = 'member',
  ROLE = 'role',
};

export enum GuildDisableCommandsTypes {
  CHANNEL = 'channel',
  GUILD = 'guild',
  MEMBER = 'member',
  ROLE = 'role',
};

export const GuildExplicitContentFilterTypeTexts: {[key: string]: string} = Object.freeze({
  [GuildExplicitContentFilterTypes.DISABLED]: 'Disabled',
  [GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES]: 'No Roles',
  [GuildExplicitContentFilterTypes.ALL_MEMBERS]: 'Everyone',
});

export const PermissionsText: {[key in Constants.Permissions]: string} = Object.freeze({
  [Permissions.ADD_REACTIONS]: 'Add Reactions',
  [Permissions.ADMINISTRATOR]: 'Administrator',
  [Permissions.ATTACH_FILES]: 'Attach Files',
  [Permissions.BAN_MEMBERS]: 'Ban Members',
  [Permissions.CHANGE_NICKNAME]: 'Change Nickname',
  [Permissions.CHANGE_NICKNAMES]: 'Change Nicknames',
  [Permissions.CONNECT]: 'Connect',
  [Permissions.CREATE_INSTANT_INVITE]: 'Create Instant Invite',
  [Permissions.DEAFEN_MEMBERS]: 'Deafen Members',
  [Permissions.EMBED_LINKS]: 'Embed Links',
  [Permissions.KICK_MEMBERS]: 'Kick Members',
  [Permissions.MANAGE_CHANNELS]: 'Manage Channels',
  [Permissions.MANAGE_EMOJIS]: 'Manage Emojis',
  [Permissions.MANAGE_GUILD]: 'Manage Guild',
  [Permissions.MANAGE_MESSAGES]: 'Manage Messages',
  [Permissions.MANAGE_ROLES]: 'Manage Roles',
  [Permissions.MANAGE_WEBHOOKS]: 'Manage Webhooks',
  [Permissions.MENTION_EVERYONE]: 'Mention Everyone',
  [Permissions.MOVE_MEMBERS]: 'Move Members',
  [Permissions.MUTE_MEMBERS]: 'Mute Members',
  [Permissions.NONE]: 'None',
  [Permissions.PRIORITY_SPEAKER]: 'Priority Speaker',
  [Permissions.READ_MESSAGE_HISTORY]: 'Read Message History',
  [Permissions.SEND_MESSAGES]: 'Send Messages',
  [Permissions.SEND_TTS_MESSAGES]: 'Text-To-Speech',
  [Permissions.SPEAK]: 'Speak',
  [Permissions.STREAM]: 'Go Live',
  [Permissions.USE_EXTERNAL_EMOJIS]: 'Use External Emojis',
  [Permissions.USE_VAD]: 'Voice Auto Detect',
  [Permissions.VIEW_AUDIT_LOG]: 'View Audit Logs',
  [Permissions.VIEW_CHANNEL]: 'View Channel',
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

export const RedisChannels = Tools.normalize({
  GUILD_BLACKLIST_UPDATE: null,
  GUILD_DISABLED_COMMAND_UPDATE: null,
  GUILD_PREFIX_UPDATE: null,
  GUILD_SETTINGS_UPDATE: null,
});

export const VerificationLevelTexts: {[key: string]: string} = Object.freeze({
  [VerificationLevels.NONE]: 'None',
  [VerificationLevels.LOW]: 'Low',
  [VerificationLevels.MEDIUM]: 'Medium',
  [VerificationLevels.HIGH]: 'High',
  [VerificationLevels.VERY_HIGH]: 'Very High',
});

export enum YoutubeResultTypes {
  CHANNEL = 0,
  VIDEO = 1,
  MOVIE = 2,
}


export const PERMISSIONS_ADMIN = Object.freeze([
  Permissions.ADMINISTRATOR,
  Permissions.BAN_MEMBERS,
  Permissions.CHANGE_NICKNAMES,
  Permissions.KICK_MEMBERS,
  Permissions.MANAGE_CHANNELS,
  Permissions.MANAGE_EMOJIS,
  Permissions.MANAGE_GUILD,
  Permissions.MANAGE_MESSAGES,
  Permissions.MANAGE_ROLES,
  Permissions.MANAGE_WEBHOOKS,
  Permissions.VIEW_AUDIT_LOG,
]);

export const PERMISSIONS_TEXT = Object.freeze([
  Permissions.ADD_REACTIONS,
  Permissions.ATTACH_FILES,
  Permissions.CREATE_INSTANT_INVITE,
  Permissions.EMBED_LINKS,
  Permissions.MENTION_EVERYONE,
  Permissions.READ_MESSAGE_HISTORY,
  Permissions.SEND_MESSAGES,
  Permissions.SEND_TTS_MESSAGES,
  Permissions.USE_EXTERNAL_EMOJIS,
  Permissions.VIEW_CHANNEL,
]);

export const PERMISSIONS_VOICE = Object.freeze([
  Permissions.CONNECT,
  Permissions.CREATE_INSTANT_INVITE,
  Permissions.DEAFEN_MEMBERS,
  Permissions.MOVE_MEMBERS,
  Permissions.MUTE_MEMBERS,
  Permissions.PRIORITY_SPEAKER,
  Permissions.SPEAK,
  Permissions.STREAM,
  Permissions.USE_VAD,
  Permissions.VIEW_CHANNEL,
]);

export const PRESENCE_CLIENT_STATUS_KEYS = Object.freeze([
  DetritusKeys[DiscordKeys.DESKTOP],
  DetritusKeys[DiscordKeys.MOBILE],
  DetritusKeys[DiscordKeys.WEB],
]);

export const TRUSTED_URLS = Object.freeze([
  'cdn.discordapp.com',
  'images-ext-1.discordapp.net',
  'images-ext-2.discordapp.net',
  'media.discordapp.net',
]);
