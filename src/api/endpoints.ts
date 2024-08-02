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

  CHANNEL:
    '/channels/:channelId',

  COMMANDS:
    '/commands',
  COMMANDS_USAGE:
    '/commands/usage',

  FUN_ASCII:
    '/fun/ascii',
  FUN_TEXT_TO_SPEECH:
    '/fun/text-to-speech',

  GUILD:
    '/guilds/:guildId',
  GUILD_ALLOWLIST:
    '/guilds/:guildId/allowlist/:allowlistId/:type',
  GUILD_BLOCKLIST:
    '/guilds/:guildId/blocklist/:blocklistId/:type',
  GUILD_COMMANDS_ALLOWLIST:
    '/guilds/:guildId/commands/:command/allowlist/:allowlistId/:type',
  GUILD_COMMANDS_BLOCKLIST:
    '/guilds/:guildId/commands/:command/blocklist/:blocklistId/:type',
  GUILD_LOGGERS:
    '/guilds/:guildId/loggers',
  GUILD_LOGGERS_DELETE:
    '/guilds/:guildId/loggers/delete',
  GUILD_FEATURES:
    '/guilds/:guildId/features',
  GUILD_FEATURES_REMOVE:
    '/guilds/:guildId/features/remove',
  GUILD_PREFIXES:
    '/guilds/:guildId/prefixes',
  GUILD_PREFIXES_DELETE:
    '/guilds/:guildId/prefixes/delete',
  GUILD_TAGS_COMMANDS:
    '/guilds/:guildId/tags/commands',

  IMAGE_CREATE_COLOR_HEX:
    '/image/create/:height:x:width:/colors/:hex:.:format:',
  IMAGE_CREATE_COLOR_RGB:
    '/image/create/:height:x:width:/colors/:red:.:green:.:blue:.:format:',

  MEDIA_A_TOOLS_PUT_CONCAT:
    '/media/a/tools/put/concat',
  MEDIA_A_TOOLS_PUT_MIX:
    '/media/a/tools/put/mix',
  MEDIA_A_TOOLS_PUT_REPLACE:
    '/media/a/tools/put/replace',

  MEDIA_AIV_MANIPULATION_ADHD:
    '/media/aiv/manipulation/adhd',

  MEDIA_AIV_TOOLS_CONCAT:
    '/media/aiv/tools/concat',
  MEDIA_AIV_TOOLS_CONVERT:
    '/media/aiv/tools/convert',
  MEDIA_AIV_TOOLS_EXIF:
    '/media/aiv/tools/exif',
  MEDIA_AIV_TOOLS_JOIN:
    '/media/aiv/tools/join',
  MEDIA_AIV_TOOLS_OVERLAY:
    '/media/aiv/tools/overlay',
  MEDIA_AIV_TOOLS_REVERSE:
    '/media/aiv/tools/reverse',
  MEDIA_AIV_TOOLS_SEE_SAW:
    '/media/aiv/tools/see-saw',
  MEDIA_AIV_TOOLS_SNIP:
    '/media/aiv/tools/snip',
  MEDIA_AIV_TOOLS_SPEED:
    '/media/aiv/tools/speed',

  MEDIA_AV_MANIPULATION_AUDIO_CHANNELS_COMBINE:
    '/media/av/manipulation/audio/channels/combine',
  MEDIA_AV_MANIPULATION_BOOST_BASS:
    '/media/av/manipulation/boost/bass',
  MEDIA_AV_MANIPULATION_COMPRESS:
    '/media/av/manipulation/compress',
  MEDIA_AV_MANIPULATION_DESTROY:
    '/media/av/manipulation/destroy',
  MEDIA_AV_MANIPULATION_VOLUME:
    '/media/av/manipulation/volume',

  MEDIA_AV_TOOLS_EXTRACT_AUDIO:
    '/media/av/tools/extract/audio',
  MEDIA_AV_TOOLS_IDENTIFY:
    '/media/av/tools/identify',
  MEDIA_AV_TOOLS_TRANSCRIBE:
    '/media/av/tools/transcribe',

  MEDIA_I_CREATE_RETROWAVE:
    '/media/i/create/retrowave',
  MEDIA_I_CREATE_TOMBSTONE:
    '/media/i/create/tombstone',
  MEDIA_I_CREATE_WORDCLOUD:
    '/media/i/create/wordcloud',
  MEDIA_I_CREATE_WORDCLOUD_BACKGROUND:
    '/media/i/create/wordcloud/background',

  MEDIA_IV_MANIPULATION_ASCII:
    '/media/iv/manipulation/ascii',
  MEDIA_IV_MANIPULATION_BLUR:
    '/media/iv/manipulation/blur',
  MEDIA_IV_MANIPULATION_BLURPLE:
    '/media/iv/manipulation/blurple',
  MEDIA_IV_MANIPULATION_CAPTION:
    '/media/iv/manipulation/caption',
  MEDIA_IV_MANIPULATION_CIRCLE:
    '/media/iv/manipulation/circle',
  MEDIA_IV_MANIPULATION_DEEPFRY:
    '/media/iv/manipulation/deepfry',
  MEDIA_IV_MANIPULATION_EXPLODE:
    '/media/iv/manipulation/explode',
  MEDIA_IV_MANIPULATION_EYES:
    '/media/iv/manipulation/eyes',
  MEDIA_IV_MANIPULATION_FLIP:
    '/media/iv/manipulation/flip',
  MEDIA_IV_MANIPULATION_FLOP:
    '/media/iv/manipulation/flop',
  MEDIA_IV_MANIPULATION_GLITCH:
    '/media/iv/manipulation/glitch',
  MEDIA_IV_MANIPULATION_GLITCH_ANIMATED:
    '/media/iv/manipulation/glitch/animated',
  MEDIA_IV_MANIPULATION_GLOBE:
    '/media/iv/manipulation/globe',
  MEDIA_IV_MANIPULATION_GOLD:
    '/media/iv/manipulation/gold',
  MEDIA_IV_MANIPULATION_GRAYSCALE:
    '/media/iv/manipulation/grayscale',
  MEDIA_IV_MANIPULATION_IMPLODE:
    '/media/iv/manipulation/implode',
  MEDIA_IV_MANIPULATION_INVERT:
    '/media/iv/manipulation/invert',
  MEDIA_IV_MANIPULATION_JPEG:
    '/media/iv/manipulation/jpeg',
  MEDIA_IV_MANIPULATION_LABELS_IFUNNY:
    '/media/iv/manipulation/labels/ifunny',
  MEDIA_IV_MANIPULATION_LEGOFY:
    '/media/iv/manipulation/legofy',
  MEDIA_IV_MANIPULATION_MAGIK:
    '/media/iv/manipulation/magik',
  MEDIA_IV_MANIPULATION_MAGIK_ANIMATED:
    '/media/iv/manipulation/magik/animated',
  MEDIA_IV_MANIPULATION_MEME:
    '/media/iv/manipulation/meme',
  MEDIA_IV_MANIPULATION_MIRROR_BOTTOM:
    '/media/iv/manipulation/mirror-bottom',
  MEDIA_IV_MANIPULATION_MIRROR_LEFT:
    '/media/iv/manipulation/mirror-left',
  MEDIA_IV_MANIPULATION_MIRROR_RIGHT:
    '/media/iv/manipulation/mirror-right',
  MEDIA_IV_MANIPULATION_MIRROR_TOP:
    '/media/iv/manipulation/mirror-top',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_ISIS:
    '/media/iv/manipulation/overlay/flag-isis',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_ISRAEL:
    '/media/iv/manipulation/overlay/flag-israel',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_LGBT:
    '/media/iv/manipulation/overlay/flag-lgbt',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_NORTH_KOREA:
    '/media/iv/manipulation/overlay/flag-north-korea',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_RUSSIA:
    '/media/iv/manipulation/overlay/flag-russia',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_TRANS:
    '/media/iv/manipulation/overlay/flag-trans',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_UK:
    '/media/iv/manipulation/overlay/flag-uk',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_USA:
    '/media/iv/manipulation/overlay/flag-usa',
  MEDIA_IV_MANIPULATION_OVERLAY_FLAG_USSR:
    '/media/iv/manipulation/overlay/flag-ussr',
  MEDIA_IV_MANIPULATION_OVERLAY_FLIES:
    '/media/iv/manipulation/overlay/flies',
  MEDIA_IV_MANIPULATION_OVERLAY_GOLDSTAR:
    '/media/iv/manipulation/overlay/goldstar',
  MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_PISTOL:
    '/media/iv/manipulation/overlay/half-life-pistol',
  MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_SHOTGUN:
    '/media/iv/manipulation/overlay/half-life-shotgun',
  MEDIA_IV_MANIPULATION_OVERLAY_HALF_LIFE_SMG:
    '/media/iv/manipulation/overlay/half-life-smg',
  MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_BERNIE_1:
    '/media/iv/manipulation/overlay/persons/bernie-1',
  MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_BOB_ROSS:
    '/media/iv/manipulation/overlay/persons/bob-ross',
  MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_GABEN_1:
    '/media/iv/manipulation/overlay/persons/gaben-1',
  MEDIA_IV_MANIPULATION_OVERLAY_PERSONS_LTT_LINUS_1:
    '/media/iv/manipulation/overlay/persons/ltt-linus-1',
  MEDIA_IV_MANIPULATION_OVERLAY_SHUTTERSTOCK:
    '/media/iv/manipulation/overlay/shutterstock',
  MEDIA_IV_MANIPULATION_OVERLAY_STARMAN:
    '/media/iv/manipulation/overlay/starman',
  MEDIA_IV_MANIPULATION_PAPER:
    '/media/iv/manipulation/paper',
  MEDIA_IV_MANIPULATION_PIX2PIX:
    '/media/iv/manipulation/pix2pix',
  MEDIA_IV_MANIPULATION_PIXELATE:
    '/media/iv/manipulation/pixelate',
  MEDIA_IV_MANIPULATION_RAIN:
    '/media/iv/manipulation/rain',
  MEDIA_IV_MANIPULATION_RAIN_GOLD:
    '/media/iv/manipulation/rain/gold',
  MEDIA_IV_MANIPULATION_SHARPEN:
    '/media/iv/manipulation/sharpen',
  MEDIA_IV_MANIPULATION_SPIN:
    '/media/iv/manipulation/spin',
  MEDIA_IV_MANIPULATION_TRACE:
    '/media/iv/manipulation/trace',
  MEDIA_IV_MANIPULATION_UNCAPTION:
    '/media/iv/manipulation/uncaption',
  MEDIA_IV_MANIPULATION_WALL:
    '/media/iv/manipulation/wall',

  MEDIA_IV_TOOLS_BACKGROUND_REMOVE:
    '/media/iv/tools/background/remove',
  MEDIA_IV_TOOLS_CROP:
    '/media/iv/tools/crop',
  MEDIA_IV_TOOLS_CROP_AUTO:
    '/media/iv/tools/crop/auto',
  MEDIA_IV_TOOLS_CROP_CIRCLE:
    '/media/iv/tools/crop/circle',
  MEDIA_IV_TOOLS_CROP_TWITTER_HEX:
    '/media/iv/tools/crop/twitter-hex',
  MEDIA_IV_TOOLS_OBJECT_REMOVE:
    '/media/iv/tools/object/remove',
  MEDIA_IV_TOOLS_RESIZE:
    '/media/iv/tools/resize',
  MEDIA_IV_TOOLS_ROTATE:
    '/media/iv/tools/rotate',
  MEDIA_IV_TOOLS_TRIM:
    '/media/iv/tools/trim',

  INFO_DISCORD:
    '/info/discord',

  ME:
    '/users/@me',

  REMINDERS:
    '/reminders',
  REMINDER:
    '/reminders/:reminderId',
  REMINDER_POSITIONAL:
    '/reminders/positional/:userId/:position',

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
  TAGS_DELETE:
    '/tags/delete',
  TAGS_DIRECTORY:
    '/tags/directory',
  TAGS_DIRECTORY_TAG:
    '/tags/directory/:tagId',
  TAGS_DIRECTORY_TAG_VERIFY:
    '/tags/directory/:tagId/verify',
  TAGS_SEARCH:
    '/tags/search',
  TAGS_SEARCH_RANDOM:
    '/tags/search/random',
  TAG:
    '/tags/:tagId',
  TAG_USE:
    '/tags/:tagId/use',
  TAG_VARIABLES:
    '/tags/:tagId/variables',
  TAG_VARIABLE:
    '/tags/:tagId/variables/:storageType/:storageId',

  USER:
    '/users/:userId',
  USER_REMINDERS:
    '/users/:userId/reminders',
  USER_REMINDERS_EXPIRED:
    '/users/:userId/reminders/expired',
  USER_TAGS:
    '/users/:userId/tags',
  USER_TAGS_COMMANDS:
    '/users/:userId/tags/commands',
  USER_USAGE_COMMANDS:
    '/users/:userId/usage/commands',
  USER_USAGE_COMMAND:
    '/users/:userId/usage/commands/:command',
  USER_VOICES:
    '/users/:userId/voices',

  UTILITIES_CODE_RUN:
    '/utilities/code/run',
  UTILITIES_FETCH_DATA:
    '/utilities/fetch/data',
  UTILITIES_FETCH_IMAGE:
    '/utilities/fetch/image',
  UTILITIES_FETCH_MEDIA:
    '/utilities/fetch/media',
  UTILITIES_FETCH_TEXT:
    '/utilities/fetch/text',
  GOOGLE_CONTENT_VISION_LABELS: // RENAME
    '/utilities/google/content-vision/labels',
  GOOGLE_CONTENT_VISION_OCR: // RENAME
    '/utilities/google/content-vision/ocr',
  GOOGLE_CONTENT_VISION_SAFE_SEARCH: // RENAME
    '/utilities/google/content-vision/safe-search',
  GOOGLE_CONTENT_VISION_WEB_DETECTION: // RENAME
    '/utilities/google/content-vision/web-detection',
  GOOGLE_TRANSLATE: // RENAME
    '/utilities/google/translate',
  UTILITIES_IMAGESCRIPT_V1: // RENAME
    '/utilities/mediascript',
  UTILITIES_ML_EDIT:
    '/utilities/ml/edit',
  UTILITIES_ML_IMAGINE:
    '/utilities/ml/imagine',
  UTILITIES_ML_INTERROGATE:
    '/utilities/ml/interrogate',
  UTILITIES_QR_CREATE:
    '/utilities/qr/create',
  UTILITIES_QR_SCAN:
    '/utilities/qr/scan',
  UTILITIES_SCREENSHOT:
    '/utilities/screenshot',

  VOICES:
    '/voices',
  VOICE:
    '/voices/:voiceId',
  VOICE_ADD:
    '/voices/:voiceId/add',
  VOICE_CLONE:
    '/voices/clone',
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
  APPLE_EMOJI: (codepoint: string): string =>
    `https://raw.githubusercontent.com/samuelngs/apple-emoji-linux/ios-16.4/png/160/emoji_u${codepoint.replace(/-/g, '_')}.png`,
  GOOGLE_EMOJI: (codepoint: string): string =>
    `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/emoji_u${codepoint.replace(/-/g, '_')}.svg`,
  MICROSOFT_EMOJI: (codepoint: string): string =>
    `https://raw.githubusercontent.com/AdvenaHQ/fluent-emoji/main/dist/100x100/${codepoint}.png`,
  STEAM_EMOJI: (name: string): string =>
    `https://steamcommunity-a.akamaihd.net/economy/emoticon/${name}`,
  TWEMOJI_SVG: (codepoint: string) =>
    `https://raw.githubusercontent.com/jdecked/twemoji/master/assets/svg/${codepoint}.svg`,
});
