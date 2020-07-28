import { Tools } from 'detritus-utils';


export const LOCALHOST_API = 'http://localhost';

export enum Domains {
  CDN = 'https://cdn.notsobot.com/',
  BETA = 'https://beta.notsobot.com/',
  STABLE = 'https://notsobot.com/',
}

export const Api = Object.freeze({
  URL: LOCALHOST_API,
  PATH: '/api',

  COMMANDS:
    '/commands',

  GOOGLE_CONTENT_VISION_OCR:
    '/google/content-vision/ocr',
  GOOGLE_SEARCH:
    '/google/search',
  GOOGLE_SEARCH_IMAGES:
    '/google/search/images',
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

  IMAGE_DEEPFRY:
    '/image/deepfry',
  IMAGE_EXPLODE:
    '/image/explode',
  IMAGE_JPEG:
    '/image/jpeg',
  IMAGE_MAGIK:
    '/image/magik',
  IMAGE_MAGIK_GIF:
    '/image/magik-gif',
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
  IMAGE_RESIZE:
    '/image/resize',

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
  SEARCH_RULE34:
    '/search/rule34',
  SEARCH_RULE34_PAHEAL:
    '/search/rule34-paheal',
  SEARCH_URBAN_DICTIONARY:
    '/search/urban-dictionary',
  SEARCH_URBAN_DICTIONARY_RANDOM:
    '/search/urban-dictionary/random',
  SEARCH_WOLFRAM_ALPHA:
    '/search/wolfram-alpha',

  USER:
    '/users/:userId',
  USER_COMMANDS:
    '/users/:userId/commands',
  USER_COMMAND:
    '/users/:userId/commands/:command',

  YOUTUBE_SEARCH:
    '/youtube/search',
});


export const CDN = Tools.URIEncodeWrap({
  URL: Domains.CDN.slice(0, -1),

  TWEMOJI_512: (codepoint: string): string =>
    `/twemoji/512x512/${codepoint}.png`,
});
