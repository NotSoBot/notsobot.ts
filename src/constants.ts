import {
  ChannelTypes,
  DetritusKeys,
  DiscordKeys,
  GuildExplicitContentFilterTypes,
  Locales as DiscordLocales,
  Permissions,
  PresenceStatuses as Statuses,
  VerificationLevels,
} from 'detritus-client/lib/constants';


export const MOMENT_FORMAT = 'y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]';

export enum BooleanEmojis {
  NO = '❌',
  YES = '✅',
};

export const ChannelTypesText: {[key in ChannelTypes]: string} = Object.freeze({
  [ChannelTypes.BASE]: 'Base Channel',
  [ChannelTypes.GUILD_TEXT]: 'Guild Text',
  [ChannelTypes.DM]: 'Direct Message',
  [ChannelTypes.GUILD_VOICE]: 'Guild Voice',
  [ChannelTypes.GROUP_DM]: 'Direct Message Group',
  [ChannelTypes.GUILD_CATEGORY]: 'Guild Category',
  [ChannelTypes.GUILD_NEWS]: 'Guild News',
  [ChannelTypes.GUILD_STORE]: 'Guild Store',
});

export enum CommandTypes {
  FUN = 'FUN',
  IMAGE = 'IMAGE',
  INFO = 'INFO',
  MODERATION = 'MODERATION',
  OWNER = 'OWNER',
  SAY = 'SAY',
  SEARCH = 'SEARCH',
  SETTINGS = 'SETTINGS',
  TOOLS = 'TOOLS',
  UTILS = 'UTILS',
}

export const DateMomentOptions = Object.freeze({
  trim: 'both mid',
});

export const DateOptions = Object.freeze({
  timeZone: 'America/New_York',
});

export enum E621Rating {
  EXPLICIT = 'e',
  QUESTIONABLE = 'q',
  SAFE = 's',
}

export const E621RatingText = Object.freeze({
  [E621Rating.EXPLICIT]: 'Explicit',
  [E621Rating.QUESTIONABLE]: 'Questionable',
  [E621Rating.SAFE]: 'Safe',
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
  DARK_MESSAGE_BACKGROUND = 3092790,
  DEFAULT = 8684933,
  ERROR = 15746887,
  LOG_CREATION = 4437377,
  LOG_DELETION = 15746887,
  LOG_UPDATE = 16426522,
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

export enum GoogleImageVideoTypes {
  OTHER = 'other',
  YOUTUBE = 'youtube',
}

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

export enum LanguageCodes {
  MULTIPLE_LANGUAGES = 'mul',
  PORTUGUESE_PORTUGAL_OTHER = 'pt',
  UNDEFINED = 'und',
}

export const LanguageCodesText = Object.freeze({
  [LanguageCodes.MULTIPLE_LANGUAGES]: 'Multiple Languages',
  [LanguageCodes.PORTUGUESE_PORTUGAL_OTHER]: 'Portuguese, Portugal',
  [LanguageCodes.UNDEFINED]: 'Undetermined Language',
});

export const GoogleLocaleFromDiscord = Object.freeze({
  [DiscordLocales.ENGLISH_US]: GoogleLocales.ENGLISH,
  [DiscordLocales.ENGLISH_GB]: GoogleLocales.ENGLISH,
  [DiscordLocales.SPANISH]: GoogleLocales.SPANISH,
  [DiscordLocales.SWEDISH]: GoogleLocales.SWEDISH,
});

export enum GuildAllowlistTypes {
  CHANNEL = 'channel',
  ROLE = 'role',
  USER = 'user',
}

export enum GuildBlocklistTypes {
  CHANNEL = 'channel',
  ROLE = 'role',
  USER = 'user',
}

export enum GuildDisableCommandsTypes {
  CHANNEL = 'channel',
  GUILD = 'guild',
  ROLE = 'role',
  USER = 'user',
}

export const GuildExplicitContentFilterTypeTexts: {[key: string]: string} = Object.freeze({
  [GuildExplicitContentFilterTypes.DISABLED]: 'Disabled',
  [GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES]: 'No Roles',
  [GuildExplicitContentFilterTypes.ALL_MEMBERS]: 'Everyone',
});

export enum GuildLoggerFlags {
  MESSAGE_CREATE = 1 << 0,
  MESSAGE_DELETE = 1 << 1,
  MESSAGE_UPDATE = 1 << 2,
  GUILD_MEMBER_ADD = 1 << 3,
  GUILD_MEMBER_REMOVE = 1 << 4,
  GUILD_MEMBER_UPDATE = 1 << 5,
  USER_UPDATE = 1 << 6,
}

export enum GuildLoggerTypes {
  MESSAGES = 0,
  GUILD_MEMBERS = 1,
}

export enum GuildPremiumTypes {
  NONE = 0,
}

export const PermissionsText: {[key in Permissions]: string} = Object.freeze({
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
  [Permissions.VIEW_GUILD_ANALYTICS]: 'View Guild Analytics',
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

export enum RedisChannels {
  GUILD_ALLOWLIST_UPDATE = 'GUILD_ALLOWLIST_UPDATE',
  GUILD_BLOCKLIST_UPDATE = 'GUILD_BLOCKLIST_UPDATE',
  GUILD_DISABLED_COMMAND_UPDATE = 'GUILD_DISABLED_COMMAND_UPDATE',
  GUILD_PREFIX_UPDATE = 'GUILD_PREFIX_UPDATE',
  GUILD_SETTINGS_UPDATE = 'GUILD_SETTINGS_UPDATE',
  USER_UPDATE = 'USER_UPDATE',
}

export enum UserFlags {
  NONE = 0,
  OWNER = 1 << 0,
}

export enum UserPremiumTypes {
  NONE = 0,
}

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
  Permissions.VIEW_GUILD_ANALYTICS,
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


export enum NotSoHeaders {
  AUTHORIZATION = 'authorization',
  CHANNEL_ID = 'x-channel-id',
  GUILD_ID = 'x-guild-id',
  USER = 'x-user',
  USER_ID = 'x-user-id',
}

export const NotSoApiKeys = Object.freeze({
  ADDED: 'added',
  ALLOWLIST: 'allowlist',
  AVATAR: 'avatar',
  BLOCKED: 'blocked',
  BLOCKLIST: 'blocklist',
  BOT: 'bot',
  BRAND: 'brand',
  CHANNEL: 'channel',
  CHANNEL_ID: 'channel_id',
  COMMAND: 'command',
  CREATED: 'created',
  CURRENCY: 'currency',
  DESCRIPTION: 'description',
  DISABLED_COMMANDS: 'disabled_commands',
  DISCRIMINATOR: 'discriminator',
  DURATION: 'duration',
  EXTENSION: 'extension',
  FLAGS: 'flags',
  FOOTER: 'footer',
  GUILD_ID: 'guild_id',
  HEADER: 'header',
  HEIGHT: 'height',
  ICON: 'icon',
  ID: 'id',
  IMAGE: 'image',
  IN_STOCK: 'in_stock',
  LIKES: 'likes',
  LOGGER_FLAGS: 'logger_flags',
  LOGGER_TYPE: 'logger_type',
  LOGGERS: 'loggers',
  NAME: 'name',
  PREFIX: 'prefix',
  PREFIXES: 'prefixes',
  PREMIUM_TYPE: 'premium_type',
  PRICE: 'price',
  PRODUCT: 'product',
  PROXY_URL: 'proxy_url',
  STARS: 'stars',
  STARS_AMOUNT: 'stars_amount',
  THUMBNAIL: 'thumbnail',
  TITLE: 'title',
  TRUSTED: 'trusted',
  TYPE: 'type',
  UPLOADED_AT: 'uploaded_at',
  URL: 'url',
  USER_ID: 'user_id',
  USERNAME: 'username',
  VIDEO: 'video',
  VIEWS: 'views',
  WEBHOOK_ID: 'webhook_id',
  WEBHOOK_TOKEN: 'webhook_token',
  WIDTH: 'width',
});

export const NotSoBotKeys = Object.freeze({
  [NotSoApiKeys.ADDED]: 'added',
  [NotSoApiKeys.ALLOWLIST]: 'allowlist',
  [NotSoApiKeys.AVATAR]: 'avatar',
  [NotSoApiKeys.BLOCKED]: 'blocked',
  [NotSoApiKeys.BLOCKLIST]: 'blocklist',
  [NotSoApiKeys.BOT]: 'bot',
  [NotSoApiKeys.BRAND]: 'brand',
  [NotSoApiKeys.CHANNEL]: 'channel',
  [NotSoApiKeys.CHANNEL_ID]: 'channelId',
  [NotSoApiKeys.COMMAND]: 'command',
  [NotSoApiKeys.CREATED]: 'created',
  [NotSoApiKeys.CURRENCY]: 'currency',
  [NotSoApiKeys.DESCRIPTION]: 'description',
  [NotSoApiKeys.DISABLED_COMMANDS]: 'disabledCommands',
  [NotSoApiKeys.DISCRIMINATOR]: 'discriminator',
  [NotSoApiKeys.DURATION]: 'duration',
  [NotSoApiKeys.EXTENSION]: 'extension',
  [NotSoApiKeys.FLAGS]: 'flags',
  [NotSoApiKeys.FOOTER]: 'footer',
  [NotSoApiKeys.GUILD_ID]: 'guildId',
  [NotSoApiKeys.HEADER]: 'header',
  [NotSoApiKeys.HEIGHT]: 'height',
  [NotSoApiKeys.ICON]: 'icon',
  [NotSoApiKeys.ID]: 'id',
  [NotSoApiKeys.IMAGE]: 'image',
  [NotSoApiKeys.IN_STOCK]: 'inStock',
  [NotSoApiKeys.LIKES]: 'likes',
  [NotSoApiKeys.LOGGER_FLAGS]: 'loggerFlags',
  [NotSoApiKeys.LOGGER_TYPE]: 'loggerType',
  [NotSoApiKeys.LOGGERS]: 'loggers',
  [NotSoApiKeys.NAME]: 'name',
  [NotSoApiKeys.PREFIX]: 'prefix',
  [NotSoApiKeys.PREFIXES]: 'prefixes',
  [NotSoApiKeys.PREMIUM_TYPE]: 'premiumType',
  [NotSoApiKeys.PRICE]: 'price',
  [NotSoApiKeys.PRODUCT]: 'product',
  [NotSoApiKeys.PROXY_URL]: 'proxyUrl',
  [NotSoApiKeys.STARS]: 'stars',
  [NotSoApiKeys.STARS_AMOUNT]: 'starsAmount',
  [NotSoApiKeys.THUMBNAIL]: 'thumbnail',
  [NotSoApiKeys.TITLE]: 'title',
  [NotSoApiKeys.TRUSTED]: 'trusted',
  [NotSoApiKeys.TYPE]: 'type',
  [NotSoApiKeys.UPLOADED_AT]: 'uploadedAt',
  [NotSoApiKeys.URL]: 'url',
  [NotSoApiKeys.USER_ID]: 'userId',
  [NotSoApiKeys.USERNAME]: 'username',
  [NotSoApiKeys.VIDEO]: 'video',
  [NotSoApiKeys.VIEWS]: 'views',
  [NotSoApiKeys.WEBHOOK_ID]: 'webhookId',
  [NotSoApiKeys.WEBHOOK_TOKEN]: 'webhookToken',
  [NotSoApiKeys.WIDTH]: 'width'
});
