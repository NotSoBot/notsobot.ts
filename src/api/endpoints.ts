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

  GOOGLE_CONTENT_VISION_OCR:
    '/google/content-vision/ocr',
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

  IMAGE_DEEPFRY:
    '/image/deepfry',
  IMAGE_DEEPFRY_GIF:
    '/image/deepfry/gif',
  IMAGE_EXPLODE:
    '/image/explode',
  IMAGE_EYES:
    '/image/eyes',
  IMAGE_GLITCH:
    '/image/glitch',
  IMAGE_GLITCH_GIF:
    '/image/glitch/gif',
  IMAGE_GRAYSCALE:
    '/image/grayscale',
  IMAGE_GRAYSCALE_GIF:
    '/image/grayscale/gif',
  IMAGE_IMPLODE:
    '/image/implode',
  IMAGE_INVERT:
    '/image/invert',
  IMAGE_JPEG:
    '/image/jpeg',
  IMAGE_LEGOFY:
    '/image/legofy',
  IMAGE_MAGIK:
    '/image/magik',
  IMAGE_MAGIK_GIF:
    '/image/magik/gif',
  IMAGE_MEME:
    '/image/meme',
  IMAGE_MIRROR_BOTTOM:
    '/image/mirror-bottom',
  IMAGE_MIRROR_LEFT:
    '/image/mirror-left',
  IMAGE_MIRROR_RIGHT:
    '/image/mirror-right',
  IMAGE_MIRROR_TOP:
    '/image/mirror-top',
  IMAGE_OVERLAY_GAY:
    '/image/overlay/gay',
  IMAGE_PIXELATE:
    '/image/pixelate',
  IMAGE_SHARPEN:
    '/image/sharpen',
  IMAGE_SPIN:
    '/image/spin',
  IMAGE_TOOLS_BACKGROUND_REMOVE:
    '/image/tools/background/remove',
  IMAGE_TOOLS_RESIZE:
    '/image/tools/resize',
  IMAGE_TOOLS_ROTATE:
    '/image/tools/rotate',
  IMAGE_WALL:
    '/image/wall',

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

  USER:
    '/users/:userId',
  USER_COMMANDS:
    '/users/:userId/commands',
  USER_COMMAND:
    '/users/:userId/commands/:command',
});


export const CDN = Tools.URIEncodeWrap({
  URL: Domains.CDN.slice(0, -1),

  TWEMOJI_512: (codepoint: string): string =>
    `/twemoji/512x512/${codepoint}.png`,
});
