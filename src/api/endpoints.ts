import { Tools } from 'detritus-utils';


export enum Domains {
  CDN = 'https://cdn.notsobot.com',
  BETA = 'https://beta.notsobot.com',
  LOCALHOST = 'http://localhost',
  STABLE = 'https://notsobot.com',
}

export const Api = Object.freeze({
  URL: Domains.STABLE,
  URL_PUBLIC: Domains.STABLE,
  PATH: '/api',

  AUDIO_TOOLS_CONVERT:
    '/audio/tools/convert',
  AUDIO_TOOLS_IDENTIFY:
    '/audio/tools/identify',

  CHANNEL:
    '/channels/:channelId',

  COMMANDS:
    '/commands',

  FUN_ASCII:
    '/fun/ascii',
  FUN_TEXT_TO_SPEECH:
    '/fun/text-to-speech',

  GOOGLE_CONTENT_VISION_LABELS:
    '/google/content-vision/labels',
  GOOGLE_CONTENT_VISION_OCR:
    '/google/content-vision/ocr',
  GOOGLE_CONTENT_VISION_SAFE_SEARCH:
    '/google/content-vision/safe-search',
  GOOGLE_CONTENT_VISION_WEB_DETECTION:
    '/google/content-vision/web-detection',
  GOOGLE_TRANSLATE:
    '/google/translate',

  GUILD:
    '/guilds/:guildId',
  GUILD_ALLOWLIST:
    '/guilds/:guildId/allowlist/:allowlistId/:type',
  GUILD_BLOCKLIST:
    '/guilds/:guildId/blocklist/:blocklistId/:type',
  GUILD_DISABLED_COMMAND:
    '/guilds/:guildId/disabled-commands/:command/:disabledId/:type',
  GUILD_LOGGERS:
    '/guilds/:guildId/loggers',
  GUILD_LOGGERS_DELETE:
    '/guilds/:guildId/loggers/delete',
  GUILD_PREFIXES:
    '/guilds/:guildId/prefixes',
  GUILD_PREFIXES_DELETE:
    '/guilds/:guildId/prefixes/delete',

  IMAGE_CREATE_COLOR_HEX:
    '/image/create/:height:x:width:/colors/:hex:.:format:',
  IMAGE_CREATE_COLOR_RGB:
    '/image/create/:height:x:width:/colors/:red:.:green:.:blue:.:format:',
  IMAGE_CREATE_RETROWAVE:
    '/image/create/retrowave',
  IMAGE_CREATE_TOMBSTONE:
    '/image/create/tombstone',
  IMAGE_CREATE_WORDCLOUD:
    '/image/create/wordcloud',
  IMAGE_CREATE_WORDCLOUD_BACKGROUND:
    '/image/create/wordcloud/background',

  IMAGE_INFORMATION_EXIF:
    '/image/information/exif',

  IMAGE_MANIPULATION_ASCII:
    '/image/manipulation/ascii',
  IMAGE_MANIPULATION_BLUR:
    '/image/manipulation/blur',
  IMAGE_MANIPULATION_BLURPLE:
    '/image/manipulation/blurple',
  IMAGE_MANIPULATION_CIRCLE:
    '/image/manipulation/circle',
  IMAGE_MANIPULATION_DEEPFRY:
    '/image/manipulation/deepfry',
  IMAGE_MANIPULATION_EXPLODE:
    '/image/manipulation/explode',
  IMAGE_MANIPULATION_EYES:
    '/image/manipulation/eyes',
  IMAGE_MANIPULATION_FLIP:
    '/image/manipulation/flip',
  IMAGE_MANIPULATION_FLOP:
    '/image/manipulation/flop',
  IMAGE_MANIPULATION_GLITCH:
    '/image/manipulation/glitch',
  IMAGE_MANIPULATION_GLITCH_GIF:
    '/image/manipulation/glitch/gif',
  IMAGE_MANIPULATION_GLOBE:
    '/image/manipulation/globe',
  IMAGE_MANIPULATION_GOLD:
    '/image/manipulation/gold',
  IMAGE_MANIPULATION_GRAYSCALE:
    '/image/manipulation/grayscale',
  IMAGE_MANIPULATION_IMPLODE:
    '/image/manipulation/implode',
  IMAGE_MANIPULATION_INVERT:
    '/image/manipulation/invert',
  IMAGE_MANIPULATION_JPEG:
    '/image/manipulation/jpeg',
  IMAGE_MANIPULATION_LEGOFY:
    '/image/manipulation/legofy',
  IMAGE_MANIPULATION_MAGIK:
    '/image/manipulation/magik',
  IMAGE_MANIPULATION_MAGIK_GIF:
    '/image/manipulation/magik/gif',
  IMAGE_MANIPULATION_MEME:
    '/image/manipulation/meme',
  IMAGE_MANIPULATION_MIRROR_BOTTOM:
    '/image/manipulation/mirror-bottom',
  IMAGE_MANIPULATION_MIRROR_LEFT:
    '/image/manipulation/mirror-left',
  IMAGE_MANIPULATION_MIRROR_RIGHT:
    '/image/manipulation/mirror-right',
  IMAGE_MANIPULATION_MIRROR_TOP:
    '/image/manipulation/mirror-top',
  IMAGE_MANIPULATION_PAPER:
    '/image/manipulation/paper',
  IMAGE_MANIPULATION_PIX2PIX:
    '/image/manipulation/pix2pix',
  IMAGE_MANIPULATION_PIXELATE:
    '/image/manipulation/pixelate',
  IMAGE_MANIPULATION_RAIN:
    '/image/manipulation/rain',
  IMAGE_MANIPULATION_RAIN_GOLD:
    '/image/manipulation/rain/gold',
  IMAGE_MANIPULATION_SHARPEN:
    '/image/manipulation/sharpen',
  IMAGE_MANIPULATION_SPIN:
    '/image/manipulation/spin',
  IMAGE_MANIPULATION_TRACE:
    '/image/manipulation/trace',
  IMAGE_MANIPULATION_WALL:
    '/image/manipulation/wall',

  IMAGE_OVERLAY_FLAG_ISIS:
    '/image/overlay/flag-isis',
  IMAGE_OVERLAY_FLAG_ISRAEL:
    '/image/overlay/flag-israel',
  IMAGE_OVERLAY_FLAG_LGBT:
    '/image/overlay/flag-lgbt',
  IMAGE_OVERLAY_FLAG_NORTH_KOREA:
    '/image/overlay/flag-north-korea',
  IMAGE_OVERLAY_FLAG_RUSSIA:
    '/image/overlay/flag-russia',
  IMAGE_OVERLAY_FLAG_TRANS:
    '/image/overlay/flag-trans',
  IMAGE_OVERLAY_FLAG_UK:
    '/image/overlay/flag-uk',
  IMAGE_OVERLAY_FLAG_USA:
    '/image/overlay/flag-usa',
  IMAGE_OVERLAY_FLAG_USSR:
    '/image/overlay/flag-ussr',
  IMAGE_OVERLAY_GOLDSTAR:
    '/image/overlay/goldstar',
  IMAGE_OVERLAY_HALF_LIFE_PISTOL:
    '/image/overlay/half-life-pistol',
  IMAGE_OVERLAY_HALF_LIFE_SHOTGUN:
    '/image/overlay/half-life-shotgun',
  IMAGE_OVERLAY_HALF_LIFE_SMG:
    '/image/overlay/half-life-smg',
  IMAGE_OVERLAY_SHUTTERSTOCK:
    '/image/overlay/shutterstock',

  IMAGE_TOOLS_BACKGROUND_REMOVE:
    '/image/tools/background/remove',
  IMAGE_TOOLS_OBJECT_REMOVE:
    '/image/tools/object/remove',
  IMAGE_TOOLS_CONVERT:
    '/image/tools/convert',
  IMAGE_TOOLS_CROP:
    '/image/tools/crop',
  IMAGE_TOOLS_CROP_CIRCLE:
    '/image/tools/crop/circle',
  IMAGE_TOOLS_CROP_TWITTER_HEX:
    '/image/tools/crop/twitter-hex',
  IMAGE_TOOLS_GIF_REVERSE:
    '/image/tools/gif/reverse',
  IMAGE_TOOLS_GIF_SEE_SAW:
    '/image/tools/gif/see-saw',
  IMAGE_TOOLS_GIF_SPEED:
    '/image/tools/gif/speed',
  IMAGE_TOOLS_RESIZE:
    '/image/tools/resize',
  IMAGE_TOOLS_ROTATE:
    '/image/tools/rotate',

  INFO_DISCORD:
    '/info/discord',

  ME:
    '/users/@me',

  REMINDERS:
    '/reminders',
  REMINDER:
    '/reminders/:reminderId',

  SEARCH_4CHAN:
    '/search/4chan',
  SEARCH_4CHAN_RANDOM:
    '/search/4chan/random',
  SEARCH_DUCKDUCKGO:
    '/search/duckduckgo',
  SEARCH_DUCKDUCKGO_IMAGES:
    '/search/duckduckgo/images',
  SEARCH_E621:
    '/search/e621',
  SEARCH_E926:
    '/search/e926',
  SEARCH_GOOGLE:
    '/search/google',
  SEARCH_GOOGLE_IMAGES:
    '/search/google/images',
  SEARCH_GOOGLE_REVERSE_IMAGES:
    '/search/google/reverse-images',
  SEARCH_IMGUR:
    '/search/imgur',
  SEARCH_IMGUR_HOME:
    '/search/imgur/home',
  SEARCH_REDDIT:
    '/search/reddit',
  SEARCH_RULE34:
    '/search/rule34',
  SEARCH_RULE34_PAHEAL:
    '/search/rule34-paheal',
  SEARCH_STEAM:
    '/search/steam',
  SEARCH_STEAM_EMOJIS:
    '/search/steam/emojis',
  SEARCH_STEAM_EMOJIS_EMOJI:
    '/search/steam/emojis/:emoji',
  SEARCH_STEAM_PROFILE:
    '/search/steam/profile',
  SEARCH_URBAN_DICTIONARY:
    '/search/urban-dictionary',
  SEARCH_URBAN_DICTIONARY_RANDOM:
    '/search/urban-dictionary/random',
  SEARCH_WIKIHOW:
    '/search/wikihow',
  SEARCH_WIKIHOW_RANDOM:
    '/search/wikihow/random',
  SEARCH_WOLFRAM_ALPHA:
    '/search/wolfram-alpha',
  SEARCH_YOUTUBE:
    '/search/youtube',

  TAGS:
    '/tags',
  TAGS_RANDOM:
    '/tags/random',
  TAGS_SERVER:
    '/tags/servers/:serverId',
  TAG_USE:
    '/tags/:tagId/use',

  USER:
    '/users/:userId',
  USER_COMMANDS:
    '/users/:userId/commands',
  USER_COMMAND:
    '/users/:userId/commands/:command',
  USER_REMINDERS:
    '/users/:userId/reminders',
  USER_REMINDERS_EXPIRED:
    '/users/:userId/reminders/expired',
  USER_TAGS:
    '/users/:userId/tags',

  UTILITIES_CODE_RUN:
    '/utilities/code/run',
  UTILITIES_CODE_RUN_GOCODEIT:
    '/utilities/code/run/gocodeit',
  UTILITIES_CODE_RUN_REXTESTER:
    '/utilities/code/run/rextester',
  UTILITIES_FETCH_DATA:
    '/utilities/fetch/data',
  UTILITIES_FETCH_IMAGE:
    '/utilities/fetch/image',
  UTILITIES_FETCH_MEDIA:
    '/utilities/fetch/media',
  UTILITIES_FETCH_TEXT:
    '/utilities/fetch/text',
  UTILITIES_IMAGESCRIPT_V1:
    '/utilities/imagescript/v1',
  UTILITIES_QR_CREATE:
    '/utilities/qr/create',
  UTILITIES_QR_SCAN:
    '/utilities/qr/scan',
  UTILITIES_SCREENSHOT:
    '/utilities/screenshot',

  VIDEO_TOOLS_CONVERT:
    '/video/tools/convert',
  VIDEO_TOOLS_EXTRACT_AUDIO:
    '/video/tools/extract/audio',
});


export const CDN = Tools.URIEncodeWrap({
  URL: Domains.CDN,

  COMMAND_ASSETS_B1:
    '/command-assets/b1.png',

  EMOJIS_APPLE: (codepoint: string) =>
    `/emojis/apple/128x128/${codepoint}.png`,
  EMOJIS_TWEMOJI: (codepoint: string) =>
    `/emojis/twemoji/v13.0.1/${codepoint}.svg`,

  TWEMOJI_512: (codepoint: string): string =>
    `/twemoji/512x512/${codepoint}.png`,
  TWEMOJI_SVG: (codepoint: string): string =>
    `/twemoji/v13.0.1/${codepoint}.svg`,
});


export const CUSTOM = Tools.URIEncodeWrap({
  STEAM_EMOJI: (name: string): string =>
    `https://steamcommunity-a.akamaihd.net/economy/emoticon/${name}`,
  TWEMOJI_SVG: (codepoint: string) =>
    `https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/${codepoint}.svg`,
});
