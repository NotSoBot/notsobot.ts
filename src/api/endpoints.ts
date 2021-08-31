import { Tools } from 'detritus-utils';


export const LOCALHOST_API = 'http://localhost';

export enum Domains {
  CDN = 'https://cdn.notsobot.com/',
  BETA = 'https://beta.notsobot.com/',
  STABLE = 'https://notsobot.com/',
}

export const Api = Object.freeze({
  URL: LOCALHOST_API,
  URL_PUBLIC: Domains.BETA.slice(0, -1),
  PATH: '/api',

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
  GUILD_TAGS:
    '/guilds/:guildId/tags',

  IMAGE_CREATE_COLOR_HEX:
    '/image/create/:height:x:width:/colors/:hex:.:format:',
  IMAGE_CREATE_COLOR_RGB:
    '/image/create/:height:x:width:/colors/:red:.:green:.:blue:.:format:',
  IMAGE_CREATE_TOMBSTONE:
    '/image/create/tombstone',

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
  IMAGE_TOOLS_CONVERT:
    '/image/tools/convert',
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

  ME:
    '/users/@me',

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

  USER:
    '/users/:userId',
  USER_COMMANDS:
    '/users/:userId/commands',
  USER_COMMAND:
    '/users/:userId/commands/:command',
  USER_TAGS:
    '/users/:userId/tags',

  UTILITIES_FETCH_IMAGE:
    '/utilities/fetch/image',
  UTILITIES_QR_CREATE:
    '/utilities/qr/create',
  UTILITIES_QR_SCAN:
    '/utilities/qr/scan',
  UTILITIES_SCREENSHOT:
    '/utilities/screenshot',
});


export const CDN = Tools.URIEncodeWrap({
  URL: Domains.CDN.slice(0, -1),

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
});
