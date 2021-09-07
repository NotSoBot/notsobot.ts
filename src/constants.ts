import {
  ChannelTypes,
  DetritusKeys,
  DiscordKeys,
  GuildExplicitContentFilterTypes,
  Locales as DiscordLocales,
  Permissions,
  PresenceStatuses as Statuses,
  UserFlags as DiscordUserFlags,
  VerificationLevels,
} from 'detritus-client/lib/constants';



export const MOMENT_FORMAT = 'y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]';
export const SNOWFLAKE_EPOCH = 1564790400000;


export enum BooleanEmojis {
  NO = '❌',
  YES = '✅',
};


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


export const DateMomentLogFormat = 'MM/DD/YY, h:mm:ss a z';

export const DateMomentOptions = Object.freeze({
  trim: 'both mid',
});

export const DateOptions = Object.freeze({
  timeZone: 'America/New_York',
});


export const DiscordEmojis = Object.freeze({
  DISCORD_BADGES: {
    [DiscordUserFlags.STAFF]: '<:d_staff:826576202189373471> ',
    [DiscordUserFlags.PARTNER]: '<:d_partner:826576193717272587>',
    [DiscordUserFlags.HYPESQUAD]: '<:d_hypesquad:826576151534108722>',
    [DiscordUserFlags.BUG_HUNTER_LEVEL_1]: '<:d_bug_hunter_level_1:826576135353139272>',
    [DiscordUserFlags.HYPESQUAD_ONLINE_HOUSE_1]: '<:d_hypesquad_bravery:826576173915308034>',
    [DiscordUserFlags.HYPESQUAD_ONLINE_HOUSE_2]: '<:d_hypesquad_brilliance:826576182308241459>',
    [DiscordUserFlags.HYPESQUAD_ONLINE_HOUSE_3]: '<:d_hypesquad_balance:826576159789285427>',
    [DiscordUserFlags.PREMIUM_EARLY_SUPPORTER]: '<:d_early_supporter:826577164966166548>',
    [DiscordUserFlags.BUG_HUNTER_LEVEL_2]: '<:d_bug_hunter_level_2:826576144001794088>',
    [DiscordUserFlags.VERIFIED_DEVELOPER]: '<:d_verified_developer:826576213493153822>',
    [DiscordUserFlags.DISCORD_CERTIFIED_MODERATOR]: '<:d_certified_moderator:874967819463327775>',
  },
  DISCORD_TAG_BOT: '<:d_tag_bot_1:826576077736378428><:d_tag_bot_2:826576087684349983>',
  DISCORD_TAG_SYSTEM: '<:d_tag_system_1:826576106592665662><:d_tag_system_2:826576115698237481>',
});


export const DiscordReactionEmojis = Object.freeze({
  WAIT: {id: '580670599630946314', name: 'stopthonk'},
});


export enum E621Rating {
  EXPLICIT = 'e',
  QUESTIONABLE = 'q',
  SAFE = 's',
}



export enum EmbedBrands {
  DUCK_DUCK_GO = 'https://cdn.notsobot.com/brands/duck-duck-go.png',
  E621 = 'https://cdn.notsobot.com/brands/e621.png',
  GOOGLE_CONTENT_VISION_SAFETY = 'https://cdn.notsobot.com/brands/google-content-vision-safety.png',
  GOOGLE_GO = 'https://cdn.notsobot.com/brands/google-go.png',
  NOTSOBOT = 'https://cdn.notsobot.com/brands/notsobot.png',
  REDDIT = 'https://cdn.notsobot.com/brands/reddit.png',
  RULE34 = 'https://cdn.notsobot.com/brands/rule34.png',
  RULE34_PAHEAL = 'https://cdn.notsobot.com/brands/rule34-paheal.png',
  STEAM = 'https://cdn.notsobot.com/brands/steam.png',
  URBAN = 'https://cdn.notsobot.com/brands/urban-dictionary.png',
  WIKIHOW = 'https://cdn.notsobot.com/brands/wikihow.png',
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
  STEAM_IN_GAME = 9484860,
  STEAM_OFFLINE = 9013641,
  STEAM_ONLINE = 5753822,
};



export enum EmojiTypes {
  APPLE = 'apple',
  EMOJI_ONE = 'emojione',
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  STEAM = 'steam',
  TWEMOJI = 'twemoji',
  TWITCH = 'twitch',
};



export enum GoogleCardTypes {
  CALCULATOR = 'CALCULATOR',
  COMPLEMENTARY_RESULTS = 'COMPLEMENTARY_RESULTS',
  CURRENCY = 'CURRENCY',
  DEFINITION = 'DEFINITION',
  FINANCE = 'FINANCE',
  KNOWLEDGE_RESULT = 'KNOWLEDGE_RESULT',
  PEOPLE_ALSO_ASK = 'PEOPLE_ALSO_ASK',
  TIME = 'TIME',
  TRANSLATION = 'TRANSLATION',
  UNITS = 'UNITS',
  UNKNOWN = 'UNKNOWN',
  WEATHER = 'WEATHER',
  WEB_SNIPPET = 'WEB_SNIPPET',
};

export const GOOGLE_CARD_TYPES_SUPPORTED = Object.freeze([
  GoogleCardTypes.CALCULATOR,
  GoogleCardTypes.CURRENCY,
  GoogleCardTypes.DEFINITION,
  GoogleCardTypes.FINANCE,
  GoogleCardTypes.KNOWLEDGE_RESULT,
  GoogleCardTypes.TIME,
  GoogleCardTypes.TRANSLATION,
  GoogleCardTypes.UNITS,
  GoogleCardTypes.WEATHER,
  GoogleCardTypes.WEB_SNIPPET,
]);



export enum GoogleContentVisionSafeSearchAttributes {
  UNKNOWN = 'UNKNOWN',
  VERY_UNLIKELY = 'VERY_UNLIKELY',
  UNLIKELY = 'UNLIKELY',
  POSSIBLE = 'POSSIBLE',
  LIKELY = 'LIKELY',
  VERY_LIKELY = 'VERY_LIKELY',
}

export const GoogleContentVisionSafeSearchAttributeValues = Object.freeze({
  [GoogleContentVisionSafeSearchAttributes.UNKNOWN]:       0,
  [GoogleContentVisionSafeSearchAttributes.VERY_UNLIKELY]: 0,
  [GoogleContentVisionSafeSearchAttributes.UNLIKELY]:    0.25,
  [GoogleContentVisionSafeSearchAttributes.POSSIBLE]:    0.50,
  [GoogleContentVisionSafeSearchAttributes.LIKELY]:      0.75,
  [GoogleContentVisionSafeSearchAttributes.VERY_LIKELY]: 1.00,
});



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

export const GoogleLocalesText: Record<GoogleLocales, string> = Object.freeze({
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
};



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
};

export enum GuildBlocklistTypes {
  CHANNEL = 'channel',
  ROLE = 'role',
  USER = 'user',
};

export enum GuildDisableCommandsTypes {
  CHANNEL = 'channel',
  GUILD = 'guild',
  ROLE = 'role',
  USER = 'user',
};



export enum GuildLoggerFlags {
  MESSAGE_CREATE = 1 << 0,
  MESSAGE_DELETE = 1 << 1,
  MESSAGE_DELETE_BULK = 1 << 2,
  MESSAGE_UPDATE = 1 << 3,
  USER_UPDATE = 1 << 4,
  GUILD_MEMBER_ADD = 1 << 5,
  GUILD_MEMBER_REMOVE = 1 << 6,
  GUILD_MEMBER_UPDATE = 1 << 7,
  VOICE_CHANNEL_CONNECTION = 1 << 8,
  VOICE_CHANNEL_MODIFY = 1 << 9,
  VOICE_CHANNEL_MOVE = 1 << 10,
  CHANNEL_CREATE = 1 << 11,
  CHANNEL_DELETE = 1 << 12,
  CHANNEL_UPDATE = 1 << 13,
  GUILD_BAN_ADD = 1 << 14,
  GUILD_BAN_REMOVE = 1 << 15,
  GUILD_ROLE_CREATE = 1 << 16,
  GUILD_ROLE_DELETE = 1 << 17,
  GUILD_ROLE_UPDATE = 1 << 18,
};


export enum GuildLoggerTypes {
  MESSAGES = 0,
  USERS = 1,
  MEMBERS = 2,
  VOICE = 3,
  CHANNELS = 4,
  BANS = 5,
  ROLES = 6,
};


export enum GuildPremiumTypes {
  NONE = 0,
  LEVEL_1 = 1,
};



export enum ImageEyeTypes {
  BIG = 'BIG',
  BLOODSHOT = 'BLOODSHOT',
  CENTER = 'CENTER',
  EYE = 'EYE',
  FLARE_BLACK = 'FLARE_BLACK',
  FLARE_BLUE = 'FLARE_BLUE',
  FLARE_GREEN = 'FLARE_GREEN',
  FLARE_PINK = 'FLARE_PINK',
  FLARE_RED = 'FLARE_RED',
  FLARE_WHITE = 'FLARE_WHITE',
  FLARE_YELLOW = 'FLARE_YELLOW',
  GOOGLY = 'GOOGLY',
  ILLUMINATI = 'ILLUMINATI',
  MONEY = 'MONEY',
  RED = 'RED',
  SMALL = 'SMALL',
  SPINNER = 'SPINNER',
  SPONGEBOB = 'SPONGEBOB',
};


export enum ImageLegofyPalettes {
  ALL = 'all',
  EFFECTS = 'effects',
  MONO = 'mono',
  TRANSPARENT = 'transparent',
};



export enum Mimetypes {
  IMAGE_GIF = 'image/gif',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_WEBP = 'image/webp',
};

export const MIMETYPES_SAFE_EMBED = Object.freeze([
  Mimetypes.IMAGE_GIF,
  Mimetypes.IMAGE_JPEG,
  Mimetypes.IMAGE_PNG,
  Mimetypes.IMAGE_WEBP,
]);


export const RatelimitKeys = Object.freeze({
  IMAGE: Math.random().toString(36).substring(7),
  SEARCH: Math.random().toString(36).substring(7),
});


export enum RedditKindTypes {
  COMMENT = 't1',
  ACCOUNT = 't2',
  LINK = 't3',
  MESSAGE = 't4',
  SUBREDDIT = 't5',
  AWARD = 't6',
};


export enum RedditSortTypes {
  COMMENTS = 'COMMENTS',
  HOT = 'HOT',
  NEW = 'NEW',
  RELEVANCE = 'RELEVANCE',
  TOP = 'TOP',
};


export enum RedditTimeTypes {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  ALL = 'ALL',
};



export enum RedisChannels {
  GUILD_ALLOWLIST_UPDATE = 'GUILD_ALLOWLIST_UPDATE',
  GUILD_BLOCKLIST_UPDATE = 'GUILD_BLOCKLIST_UPDATE',
  GUILD_DISABLED_COMMAND_UPDATE = 'GUILD_DISABLED_COMMAND_UPDATE',
  GUILD_LOGGER_UPDATE = 'GUILD_LOGGER_UPDATE',
  GUILD_PREFIX_UPDATE = 'GUILD_PREFIX_UPDATE',
  GUILD_SETTINGS_UPDATE = 'GUILD_SETTINGS_UPDATE',
  USER_UPDATE = 'USER_UPDATE',
};



export enum Timezones {
  MIT = 'Pacific/Midway',
  HST = 'Us/Hawaii',
  AST = 'US/Alaska',
  PST = 'US/Pacific',
  PNT = 'America/Phoenix',
  MST = 'US/Mountain',
  CST = 'US/Central',
  EST = 'US/Eastern',
  IET = 'US/East-Indiana',
  PRT = 'Etc/GMT-4',
  CNT = 'Canada/Newfoundland',
  AGT = 'Etc/GMT-3',
  BET = 'Brazil/East',
  CAT = 'Etc/GMT-1',
  GMT = 'GMT',
  ECT = 'Etc/GMT+1',
  EET = 'EET',
  ART = 'Egypt',
  EAT = 'Etc/GMT+3',
  MET = 'MET',
  NET = 'Etc/GMT+4',
  PLT = 'Etc/GMT+5',
  IST = 'Etc/GMT+5:30',
  BST = 'Etc/GMT+6',
  VST = 'Etc/GMT+7',
  CTT = 'Etc/GMT+8',
  JST = 'Japan',
  ACT = 'Australia/ACT',
  AET = 'Etc/GMT+10',
  SST = 'Etc/GMT+11',
  NST = 'Etc/GMT+12',
};



export enum UserFlags {
  NONE = 0,
  OWNER = 1 << 0,
};


export enum UserPremiumTypes {
  NONE = 0,
};



export enum YoutubeResultTypes {
  CHANNEL = 0,
  VIDEO = 1,
  MOVIE = 2,
  PLAYLIST = 3,
};



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
  Permissions.MANAGE_THREADS,
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
  Permissions.USE_APPLICATION_COMMANDS,
  Permissions.USE_EXTERNAL_EMOJIS,
  Permissions.USE_PRIVATE_THREADS,
  Permissions.USE_PUBLIC_THREADS,
  Permissions.VIEW_CHANNEL,
]);


export const PERMISSIONS_VOICE = Object.freeze([
  Permissions.CONNECT,
  Permissions.CREATE_INSTANT_INVITE,
  Permissions.DEAFEN_MEMBERS,
  Permissions.MOVE_MEMBERS,
  Permissions.MUTE_MEMBERS,
  Permissions.PRIORITY_SPEAKER,
  Permissions.REQUEST_TO_SPEAK,
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
};



export const NotSoApiKeys = Object.freeze({
  ABOUT: 'about',
  ADDED: 'added',
  ALLOWLIST: 'allowlist',
  AVATAR: 'avatar',
  BLOCKED: 'blocked',
  BLOCKLIST: 'blocklist',
  BOT: 'bot',
  BRAND: 'brand',
  CHANNEL: 'channel',
  CHANNEL_ID: 'channel_id',
  COLOR: 'color',
  COMMAND: 'command',
  CREATED: 'created',
  CURRENCY: 'currency',
  DESCRIPTION: 'description',
  DISABLED_COMMANDS: 'disabled_commands',
  DISABLED_LOGGER_EVENTS: 'disabled_logger_events',
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
  INGREDIENTS: 'ingredients',
  IS_RAW_IMAGE: 'is_raw_image',
  LICENSABLE: 'licensable',
  LIKES: 'likes',
  LOCALE: 'locale',
  LOGGER_FLAGS: 'logger_flags',
  LOGGER_TYPE: 'logger_type',
  LOGGERS: 'loggers',
  METADATA: 'metadata',
  NAME: 'name',
  PREFIX: 'prefix',
  PREFIXES: 'prefixes',
  PREMIUM_TYPE: 'premium_type',
  PRICE: 'price',
  PRODUCT: 'product',
  PROXY_URL: 'proxy_url',
  RECIPE: 'recipe',
  SERVINGS: 'servings',
  STARS: 'stars',
  STARS_AMOUNT: 'stars_amount',
  TEXT: 'text',
  TIMEZONE: 'timezone',
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
  [NotSoApiKeys.ABOUT]: 'about',
  [NotSoApiKeys.ADDED]: 'added',
  [NotSoApiKeys.ALLOWLIST]: 'allowlist',
  [NotSoApiKeys.AVATAR]: 'avatar',
  [NotSoApiKeys.BLOCKED]: 'blocked',
  [NotSoApiKeys.BLOCKLIST]: 'blocklist',
  [NotSoApiKeys.BOT]: 'bot',
  [NotSoApiKeys.BRAND]: 'brand',
  [NotSoApiKeys.CHANNEL]: 'channel',
  [NotSoApiKeys.CHANNEL_ID]: 'channelId',
  [NotSoApiKeys.COLOR]: 'color',
  [NotSoApiKeys.COMMAND]: 'command',
  [NotSoApiKeys.CREATED]: 'created',
  [NotSoApiKeys.CURRENCY]: 'currency',
  [NotSoApiKeys.DESCRIPTION]: 'description',
  [NotSoApiKeys.DISABLED_COMMANDS]: 'disabledCommands',
  [NotSoApiKeys.DISABLED_LOGGER_EVENTS]: 'disabledLoggerEvents',
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
  [NotSoApiKeys.INGREDIENTS]: 'ingredients',
  [NotSoApiKeys.IS_RAW_IMAGE]: 'isRawImage',
  [NotSoApiKeys.LICENSABLE]: 'licensable',
  [NotSoApiKeys.LIKES]: 'likes',
  [NotSoApiKeys.LOCALE]: 'locale',
  [NotSoApiKeys.LOGGER_FLAGS]: 'loggerFlags',
  [NotSoApiKeys.LOGGER_TYPE]: 'loggerType',
  [NotSoApiKeys.LOGGERS]: 'loggers',
  [NotSoApiKeys.METADATA]: 'metadata',
  [NotSoApiKeys.NAME]: 'name',
  [NotSoApiKeys.PREFIX]: 'prefix',
  [NotSoApiKeys.PREFIXES]: 'prefixes',
  [NotSoApiKeys.PREMIUM_TYPE]: 'premiumType',
  [NotSoApiKeys.PRICE]: 'price',
  [NotSoApiKeys.PRODUCT]: 'product',
  [NotSoApiKeys.PROXY_URL]: 'proxyUrl',
  [NotSoApiKeys.RECIPE]: 'recipe',
  [NotSoApiKeys.SERVINGS]: 'servings',
  [NotSoApiKeys.STARS]: 'stars',
  [NotSoApiKeys.STARS_AMOUNT]: 'starsAmount',
  [NotSoApiKeys.TEXT]: 'text',
  [NotSoApiKeys.TIMEZONE]: 'timezone',
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



export const ChannelTypesText: Record<ChannelTypes, string> = Object.freeze({
  [ChannelTypes.BASE]: 'Base Channel',
  [ChannelTypes.GUILD_TEXT]: 'Guild Text',
  [ChannelTypes.DM]: 'Direct Message',
  [ChannelTypes.GUILD_VOICE]: 'Guild Voice',
  [ChannelTypes.GROUP_DM]: 'Direct Message Group',
  [ChannelTypes.GUILD_CATEGORY]: 'Guild Category',
  [ChannelTypes.GUILD_NEWS]: 'Guild News',
  [ChannelTypes.GUILD_STORE]: 'Guild Store',

  [ChannelTypes.GUILD_NEWS_THREAD]: 'Guild News Thread',
  [ChannelTypes.GUILD_PUBLIC_THREAD]: 'Guild Public Thread',
  [ChannelTypes.GUILD_PRIVATE_THREAD]: 'Guild Private Thread',
  [ChannelTypes.GUILD_STAGE_VOICE]: 'Guild Stage Voice',
  [ChannelTypes.GUILD_DIRECTORY]: 'Guild Directory',
});



export const DiscordUserFlagsText: Record<DiscordUserFlags, string> = Object.freeze({
  [DiscordUserFlags.STAFF]: 'Discord Staff',
  [DiscordUserFlags.PARTNER]: 'Discord Partner',
  [DiscordUserFlags.HYPESQUAD]: 'HypeSquad Events',
  [DiscordUserFlags.BUG_HUNTER_LEVEL_1]: 'Discord Bug Hunter',
  [DiscordUserFlags.MFA_SMS]: 'MFA SMS?',
  [DiscordUserFlags.PREMIUM_PROMO_DISMISSED]: 'Nitro Promotion Dismissed',
  [DiscordUserFlags.HYPESQUAD_ONLINE_HOUSE_1]: 'HypeSquad Bravery',
  [DiscordUserFlags.HYPESQUAD_ONLINE_HOUSE_2]: 'HypeSquad Brilliance',
  [DiscordUserFlags.HYPESQUAD_ONLINE_HOUSE_3]: 'HypeSquad Balance',
  [DiscordUserFlags.PREMIUM_EARLY_SUPPORTER]: 'Early Nitro Supporter',
  [DiscordUserFlags.TEAM_USER]: 'Team Owner Bot',
  [DiscordUserFlags.SYSTEM]: 'System User',
  [DiscordUserFlags.HAS_UNREAD_URGENT_MESSAGES]: 'Unread Urgent Message',
  [DiscordUserFlags.BUG_HUNTER_LEVEL_2]: 'Discord Bug Hunter 2',
  [DiscordUserFlags.VERIFIED_BOT]: 'Verified Bot',
  [DiscordUserFlags.VERIFIED_DEVELOPER]: 'Verified Bot Developer',
  [DiscordUserFlags.DISCORD_CERTIFIED_MODERATOR]: 'Discord Certified Moderator',
});



export const E621RatingText: Record<E621Rating, string> = Object.freeze({
  [E621Rating.EXPLICIT]: 'Explicit',
  [E621Rating.QUESTIONABLE]: 'Questionable',
  [E621Rating.SAFE]: 'Safe',
});



export const LanguageCodesText: Record<LanguageCodes, string> = Object.freeze({
  [LanguageCodes.MULTIPLE_LANGUAGES]: 'Multiple Languages',
  [LanguageCodes.PORTUGUESE_PORTUGAL_OTHER]: 'Portuguese, Portugal',
  [LanguageCodes.UNDEFINED]: 'Undetermined Language',
});



export const GuildExplicitContentFilterTypeTexts: Record<number, string> = Object.freeze({
  [GuildExplicitContentFilterTypes.DISABLED]: 'Disabled',
  [GuildExplicitContentFilterTypes.MEMBERS_WITHOUT_ROLES]: 'No Roles',
  [GuildExplicitContentFilterTypes.ALL_MEMBERS]: 'Everyone',
});



export const PermissionsText = Object.freeze({
  [String(Permissions.ADD_REACTIONS)]: 'Add Reactions',
  [String(Permissions.ADMINISTRATOR)]: 'Administrator',
  [String(Permissions.ATTACH_FILES)]: 'Attach Files',
  [String(Permissions.BAN_MEMBERS)]: 'Ban Members',
  [String(Permissions.CHANGE_NICKNAME)]: 'Change Nickname',
  [String(Permissions.CHANGE_NICKNAMES)]: 'Change Nicknames',
  [String(Permissions.CONNECT)]: 'Connect',
  [String(Permissions.CREATE_INSTANT_INVITE)]: 'Create Instant Invite',
  [String(Permissions.DEAFEN_MEMBERS)]: 'Deafen Members',
  [String(Permissions.EMBED_LINKS)]: 'Embed Links',
  [String(Permissions.KICK_MEMBERS)]: 'Kick Members',
  [String(Permissions.MANAGE_CHANNELS)]: 'Manage Channels',
  [String(Permissions.MANAGE_EMOJIS)]: 'Manage Emojis',
  [String(Permissions.MANAGE_GUILD)]: 'Manage Guild',
  [String(Permissions.MANAGE_MESSAGES)]: 'Manage Messages',
  [String(Permissions.MANAGE_ROLES)]: 'Manage Roles',
  [String(Permissions.MANAGE_THREADS)]: 'Manage Threads',
  [String(Permissions.MANAGE_WEBHOOKS)]: 'Manage Webhooks',
  [String(Permissions.MENTION_EVERYONE)]: 'Mention Everyone',
  [String(Permissions.MOVE_MEMBERS)]: 'Move Members',
  [String(Permissions.MUTE_MEMBERS)]: 'Mute Members',
  [String(Permissions.NONE)]: 'None',
  [String(Permissions.PRIORITY_SPEAKER)]: 'Priority Speaker',
  [String(Permissions.READ_MESSAGE_HISTORY)]: 'Read Message History',
  [String(Permissions.REQUEST_TO_SPEAK)]: 'Request To Speak',
  [String(Permissions.SEND_MESSAGES)]: 'Send Messages',
  [String(Permissions.SEND_TTS_MESSAGES)]: 'Text-To-Speech',
  [String(Permissions.SPEAK)]: 'Speak',
  [String(Permissions.STREAM)]: 'Go Live',
  [String(Permissions.USE_APPLICATION_COMMANDS)]: 'Use Application Commands',
  [String(Permissions.USE_EXTERNAL_EMOJIS)]: 'Use External Emojis',
  [String(Permissions.USE_PRIVATE_THREADS)]: 'Use Private Threads',
  [String(Permissions.USE_PUBLIC_THREADS)]: 'Use Public Threads',
  [String(Permissions.USE_VAD)]: 'Voice Auto Detect',
  [String(Permissions.VIEW_AUDIT_LOG)]: 'View Audit Logs',
  [String(Permissions.VIEW_CHANNEL)]: 'View Channel',
  [String(Permissions.VIEW_GUILD_ANALYTICS)]: 'View Guild Analytics',
});



export const PresenceStatusColors: Record<string, number> = Object.freeze({
  [Statuses.ONLINE]: 4437377,
  [Statuses.DND]: 15746887,
  [Statuses.IDLE]: 16426522,
  [Statuses.OFFLINE]: 7634829,
});

export const PresenceStatusTexts: Record<string, string> = Object.freeze({
  [Statuses.ONLINE]: 'Online',
  [Statuses.DND]: 'Do Not Disturb',
  [Statuses.IDLE]: 'Idle',
  [Statuses.OFFLINE]: 'Offline',
});



export const TimezoneText: Record<Timezones, string> = Object.freeze({
  [Timezones.MIT]: 'Midway Islands Time, -11:00',
  [Timezones.HST]: 'Hawaii Standard Time, -10:00',
  [Timezones.AST]: 'Alaska Standard Time, -9:00',
  [Timezones.PST]: 'Pacific Standard Time, -8:00',
  [Timezones.PNT]: 'Phoenix Standard Time, -7:00',
  [Timezones.MST]: 'Mountain Standard Time, -7:00',
  [Timezones.CST]: 'Central Standard Time, -6:00',
  [Timezones.EST]: 'Eastern Standard Time, -5:00',
  [Timezones.IET]: 'Indiana Eastern Standard Time, -5:00',
  [Timezones.PRT]: 'Puetro Rico and US Virgin Islands Time, -4:00',
  [Timezones.CNT]: 'Canada Newfoundland Time, -3:30',
  [Timezones.AGT]: 'Argentina Standard Time, -3:00',
  [Timezones.BET]: 'Brazil Eastern Time, -3:00',
  [Timezones.CAT]: 'Central African Time, -1:00',
  [Timezones.GMT]: 'Greenwich Mean Time',
  [Timezones.ECT]: 'European Central Time, +1:00',
  [Timezones.EET]: 'Eastern European Time, +2:00',
  [Timezones.ART]: 'Arabic/Egypt Standard Time, +2:00',
  [Timezones.EAT]: 'Eastern African Time, +3:00',
  [Timezones.MET]: 'Middle East Time, +3:30',
  [Timezones.NET]: 'Near East Time, +4:00',
  [Timezones.PLT]: 'Pakistan Lahore Time, +5:00',
  [Timezones.IST]: 'India Standard Time, +5:30',
  [Timezones.BST]: 'Bangladesh Standard Time, +6:00',
  [Timezones.VST]: 'Vietnam Standard Time, +7:00',
  [Timezones.CTT]: 'China Taiwan Time, +8:00',
  [Timezones.JST]: 'Japan Standard Time, +9:00',
  [Timezones.ACT]: 'Australia Central Time, +9:30',
  [Timezones.AET]: 'Australia Eastern Time, +10:00',
  [Timezones.SST]: 'Solomon Standard Time, +11:00',
  [Timezones.NST]: 'New Zealand Standard Time, +12:00',
});


export enum TTSVoices {
  BLUE_DE_DE_DIETER = 'BLUE_DE_DE_DIETER',
  BLUE_EN_GB_KATE = 'BLUE_EN_GB_KATE',
  BLUE_EN_US_ALLISON = 'BLUE_EN_US_ALLISON',
  BLUE_EN_US_LISA = 'BLUE_EN_US_LISA',
  BLUE_EN_US_MICHAEL = 'BLUE_EN_US_MICHAEL',
  BLUE_ES_ES_ENRIQUE = 'BLUE_ES_ES_ENRIQUE',
  BLUE_FR_FR_RENEE = 'BLUE_FR_FR_RENEE',
  BLUE_IT_IT_FRANCESCA = 'BLUE_IT_IT_FRANCESCA',
  BLUE_JA_JP_EMI = 'BLUE_JA_JP_EMI',
  BLUE_PT_BR_ISABELA = 'BLUE_PT_BR_ISABELA',
}


export const TTS_VOICES = Object.values(TTSVoices);


export const VerificationLevelTexts: Record<string, string> = Object.freeze({
  [VerificationLevels.NONE]: 'None',
  [VerificationLevels.LOW]: 'Low',
  [VerificationLevels.MEDIUM]: 'Medium',
  [VerificationLevels.HIGH]: 'High',
  [VerificationLevels.VERY_HIGH]: 'Very High',
});
