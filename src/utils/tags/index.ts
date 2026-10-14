import * as crypto from 'crypto';
import * as vm from 'vm';

import { Collections, Command, Interaction, Structures } from 'detritus-client';
import {
  MarkupTimestampStyles,
  MessageComponentButtonStyles,
  MessageComponentTypes,
  Permissions,
} from 'detritus-client/lib/constants';
import { Embed, Markup, Snowflake } from 'detritus-client/lib/utils';
import { RequestFile } from 'detritus-rest';
import MiniSearch from 'minisearch';

import UserStore from '../../stores/users';
import UserSettingsStore from '../../stores/usersettings';

import {
  createReminder,
  deleteReminderPositional,
  editReminder,
  editUserSettings,
  fetchTagBlobs,
  fetchTagId,
  fetchTagVariable,
  fetchReminderPositional,
  fetchTagVariables,
  fetchUserReminders,
  deleteTagVariable,
  generateTag,
  googleContentVisionOCR,
  googleTranslate,
  mediaAVToolsExtractAudio,
  mediaAVToolsTranscribe,
  putTagBlobs,
  putTagVariable,
  putTagVariables,
  searchDuckDuckGoImages,
  searchGoogleImages,
  searchImgur,
  searchYoutube,
  utilitiesCodeRun,
  utilitiesFetchMedia,
  utilitiesFetchText,
  utilitiesMediascript,
  utilitiesLocations,
  utilitiesMLEdit,
  utilitiesMLImagine,
  utilitiesMLInterrogate,
  utilitiesProxyRequest,
  utilitiesQrCreate,
  utilitiesQrScan,
  utilitiesScreenshot,
  utilitiesWeather,
} from '../../api';
import { RestOptions, RestResponses, RestResponsesRaw } from '../../api/types';
import {
  CodeLanguages,
  GoogleLocales,
  MeasurementUnits,
  Mimetypes,
  MLDiffusionModels,
  ProxyRequestMethods,
  TagBlobStorageTypes,
  TagGenerationModels,
  TagVariableStorageTypes,
  Timezones,
  TimezonesToText,
  YoutubeResultTypes,
  CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND,
  MAX_MEMBERS_SAFE,
} from '../../constants';

import { ReminderInterval } from '../../listeners';
import { getAIPersonality } from '../formatter/commands/tag.generate';
import { increaseUsage } from '../formatter/commands/tag.show';

import * as DefaultParameters from '../defaultparameters';
import { Translator, getCachedTranslator } from '../i18n';
import { MathWorker, MATH_ERROR_TIMEOUT_MESSAGE } from '../math';
import { PageObject } from '../paginator';
import * as Parameters from '../parameters';
import {
  bigIntGenerateBetween,
  checkNSFW,
  convertToBigIntFloats,
  generateCodeFromLanguage,
  generateCodeStdin,
  getCodeLanguage,
  getGuildObjectForJSONSerialization,
  isSnowflake,
  isValidAttachmentUrl,
  jobWaitForResponse,
  jobWaitForResult,
  languageCodeToText,
  randomFromArray,
  randomFromIterator,
  textToBoolean,
  traverseJSON,
} from '../tools';

import { TagExitError, TagRequestError } from './exceptions';
import { parseComponentFromData } from './tools';

export { TagExitError, TagRequestError };



const findChannelParameter = Parameters.channel({inGuild: true});
// channel names are compared lowercased, so lowercase the query too
const findChannel = (
  value: string,
  context: Command.Context | Interaction.InteractionContext,
): Structures.Channel | null => findChannelParameter(value.toLowerCase(), context);
const findMemberOrUser = Parameters.memberOrUser();

const lastAudioUrl = Parameters.lastMediaUrl({image: false, video: false});
const lastAudioOrVideoUrl = Parameters.lastMediaUrl({image: false});
const lastImageUrl = Parameters.lastMediaUrl({audio: false, video: false});
const lastImageOrVideoUrl = Parameters.lastMediaUrl({audio: false});
const lastMediaUrl = Parameters.lastMediaUrl();
const lastVideoUrl = Parameters.lastMediaUrl({audio: false, image: false});


export const TagSymbols = Object.freeze({
  BRACKET_LEFT: '{',
  BRACKET_RIGHT: '}',
  IGNORE: '\\',
  SPLITTER_ARGUMENT: '|',
  SPLITTER_FUNCTION: ':',
});

export const ATTACHMENT_EXTENSIONS_IMAGE = [
  'bmp',
  'heic',
  'gif',
  'ico',
  'jpg',
  'jpeg',
  'png',
  'raw',
  'tiff',
  'webp',
];

export const ATTACHMENT_EXTENSIONS_MEDIA = [
  'flac',
  'mov',
  'mp3',
  'mp4',
  'txt',
  'wav',
  'webm',
];

export const ATTACHMENT_EXTENSIONS = [...ATTACHMENT_EXTENSIONS_IMAGE, ...ATTACHMENT_EXTENSIONS_MEDIA];

export interface TagLimits {
  MAX_AI_EXECUTIONS: number,
  MAX_API_MANIPULATIONS: number,
  MAX_ATTACHMENTS: number,
  MAX_BLOB_VALUE_LENGTH: number,
  MAX_COMPONENT_EXECUTIONS: number,
  MAX_EMBEDS: number,
  MAX_ITERATIONS: number,
  MAX_NETWORK_REQUESTS: number,
  MAX_NETWORK_REQUESTS_ML: number,
  MAX_NETWORK_REQUESTS_SAFETY: number,
  MAX_PAGES: number,
  MAX_STORAGE_GLOBAL_AMOUNT: number,
  MAX_STORAGE_GUILD_AMOUNT: number,
  MAX_STORAGE_CHANNEL_AMOUNT: number,
  MAX_STORAGE_USER_AMOUNT: number,
  MAX_STORAGE_KEY_LENGTH: number,
  MAX_STORAGE_VALUE_LENGTH: number,
  MAX_SYNC_TIME: number,
  MAX_TAG_EXECUTIONS: number,
  MAX_TEXT_LENGTH: number,
  MAX_TIME_REGEX: number,
  MAX_VARIABLE_KEY_LENGTH: number,
  MAX_VARIABLE_LENGTH: number,
  MAX_VARIABLES: number,
}

export const TagLimitDefaults: TagLimits = Object.freeze({
  MAX_AI_EXECUTIONS: 1,
  MAX_API_MANIPULATIONS: 1,
  MAX_ATTACHMENTS: 10,
  MAX_BLOB_VALUE_LENGTH: 256 * 1024,
  MAX_COMPONENT_EXECUTIONS: 2,
  MAX_EMBEDS: 10,
  MAX_ITERATIONS: 450,
  MAX_NETWORK_REQUESTS: 15,
  MAX_NETWORK_REQUESTS_ML: 5,
  MAX_NETWORK_REQUESTS_SAFETY: 2,
  MAX_PAGES: 1000,
  MAX_STORAGE_GLOBAL_AMOUNT: 5,
  MAX_STORAGE_GUILD_AMOUNT: 5,
  MAX_STORAGE_CHANNEL_AMOUNT: 5,
  MAX_STORAGE_USER_AMOUNT: 5,
  MAX_STORAGE_KEY_LENGTH: 128,
  MAX_STORAGE_VALUE_LENGTH: 16384,
  // total ms a tag (and the tags it calls) can spend in {math}/{replace}, they block the bot while running
  MAX_SYNC_TIME: 2000,
  MAX_TAG_EXECUTIONS: 2,
  // total output text, on top of the attachment size limit (which can be hundreds of mb)
  MAX_TEXT_LENGTH: 10 * 1024 * 1024,
  MAX_TIME_REGEX: 25,
  MAX_VARIABLE_KEY_LENGTH: 64,
  MAX_VARIABLE_LENGTH: 1 * 1024 * 1024,
  MAX_VARIABLES: 100,
});

export function getMaxTextLength(
  context: Command.Context | Interaction.InteractionContext,
  tag: TagResult,
): number {
  return Math.min(context.maxAttachmentSize, tag.limits.MAX_TEXT_LENGTH);
}


// check before appending so one function (like {foreach} running {repeat}) can't build a huge string first
export function appendTagText(
  context: Command.Context | Interaction.InteractionContext,
  tag: TagResult,
  text: string,
): void {
  const maxTextLength = getMaxTextLength(context, tag);
  if (maxTextLength < tag.text.length + text.length) {
    throw new Error(tag.translate('tagscript.text_exceeded_bytes', {max: maxTextLength}));
  }
  tag.text += text;
}


export const PRIVATE_VARIABLE_PREFIX = '__';

export const ATTACHMENT_URL_REGEX = /(https?:\/\/(?:media\.discordapp\.net|cdn.discordapp.com)\/attachments\/[0-9]*\/[0-9]*\/[A-Za-z0-9_.-]*(?:\?[a-zA-Z0-9&=]*)?)/g;
export const MATH_NON_NUMERIC_REGEX = /[^+\-*\/()0-9.n><&]/g;
export const SCRIPT_REGEX = /\{((?:(?!:)(?:.|\s))*):([\s\S]+)\}/;
export const URL_FILE_REPLACEMENT_REGEX = /FILE_([0-9]+)(_COPY)?/g;

export const REGEX_ARGUMENT_SPLITTER = new RegExp(`(?<!\\\\)[${TagSymbols.SPLITTER_ARGUMENT}]`, 'g');
export const REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT = new RegExp(`\\\\\\${TagSymbols.SPLITTER_ARGUMENT}`, 'g');
export const REGEX_BRACKET_OR_SPLITTER_ESCAPE_REPLACEMENT = /\\([{}|])/g;

// {newline} inserts this (a unicode noncharacter, reserved for internal use) and it gets replaced with `\n` at the end
// so trimming in between does not eat the newlines
export const NEWLINE_SENTINEL = '\uFDD0';
export const REGEX_NEWLINE_SENTINEL = /\uFDD0/g;


export enum PrivateVariables {
  AI_EXECUTIONS = '__aiExecutions',
  API_MANIPULATIONS = '__apiManipulations',
  ARGS = '__args',
  ARGS_STRING = '__argsString',
  COMPONENT_EXECUTIONS = '__componentExecutions',
  FILE_SIZE = '__fileSize',
  FILES = '__files',
  IS_FROM_AI = '__isFromAI',
  IS_FROM_CHILD_PARSING = '__isFromChildParsing',
  ITERATIONS_REMAINING = '__iterationsRemaining',
  NETWORK_REQUESTS = '__networkRequests',
  NETWORK_REQUESTS_ML = '__networkRequestsML',
  NETWORK_REQUESTS_SAFETY = '__networkRequestsSafety',
  PARENT_TAG_ID = '__parentTagId',
  RESULTS = '__results',
  SETTINGS = '__settings',
  SYNC_TIME = '__syncTime',
  TAG_EXECUTIONS = '__tagExecutions',
  VALUES = '__values',
  ID_X = 'idx',
  VALUE_X = 'valuex',
}


// counters that enforce a tag's limits, these carry over from called tags even when they error
export const TAG_LIMIT_VARIABLES: ReadonlyArray<string> = Object.freeze([
  PrivateVariables.AI_EXECUTIONS,
  PrivateVariables.API_MANIPULATIONS,
  PrivateVariables.COMPONENT_EXECUTIONS,
  PrivateVariables.FILE_SIZE,
  PrivateVariables.ITERATIONS_REMAINING,
  PrivateVariables.NETWORK_REQUESTS,
  PrivateVariables.NETWORK_REQUESTS_ML,
  PrivateVariables.NETWORK_REQUESTS_SAFETY,
  PrivateVariables.SYNC_TIME,
  PrivateVariables.TAG_EXECUTIONS,
]);


export const AllowedDiscordProperties = Object.freeze({
  [Structures.Member.constructor.name]: {
    functions: [],
    variables: ['avatar', 'avatarUrl', 'color', 'colorRole', 'deaf', 'discriminator', 'highestRole', 'hoistedRole', 'id', 'isBoosting', 'isOffline', 'isOwner', 'joinedAt', 'joinedAtUnix', 'mention', 'mute', 'nick', 'name', 'username'],
  },
  [Structures.Role.constructor.name]: {
    functions: [],
    variables: ['botId', 'color', 'createdAt', 'createdAtUnix', 'flags', 'hoist', 'id', 'integrationId', 'isBoosterRole', 'isDefault', 'isInPrompt', 'isPurchasable', 'managed', 'mention', 'mentionable', 'name', 'permissions', 'position', 'subscriptionListingId'],
  },
});


export enum TagIfComparisons {
  EQUAL = '=',
  EQUAL_NOT = "!=",
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  TILDE = '~',
}


export const TAG_IF_COMPARISONS = [
  TagIfComparisons.EQUAL,
  TagIfComparisons.EQUAL_NOT,
  TagIfComparisons.GREATER_THAN,
  TagIfComparisons.GREATER_THAN_OR_EQUAL,
  TagIfComparisons.LESS_THAN,
  TagIfComparisons.LESS_THAN_OR_EQUAL,
  TagIfComparisons.TILDE,
];


// maybe make {argattachment}
export enum TagFunctions {
  AI = 'AI',
  API_CREATE_REMINDER = 'API_CREATE_REMINDER',
  API_DELETE_REMINDER = 'API_DELETE_REMINDER',
  API_EDIT_REMINDER = 'API_EDIT_REMINDER',
  API_FETCH_REMINDERS = 'API_FETCH_REMINDERS',
  API_SEARCH_DUCKDUCKGO_IMAGES = 'API_SEARCH_DUCKDUCKGO_IMAGES',
  API_SEARCH_IMGUR = 'API_SEARCH_IMGUR',
  API_UTILITIES_LOCATIONS = 'API_UTILITIES_LOCATIONS',
  API_UTILITIES_QR_CREATE = 'API_UTILITIES_QR_CREATE',
  API_UTILITIES_QR_SCAN = 'API_UTILITIES_QR_SCAN',
  API_UTILITIES_SCREENSHOT = 'API_UTILITIES_SCREENSHOT',
  API_UTILITIES_WEATHER = 'API_UTILITIES_WEATHER',
  ARG = 'ARG',
  ARG_SAFE = 'ARG_SAFE',
  ARGS = 'ARGS',
  ARGS_LEN = 'ARGS_LEN',
  ARGS_SAFE = 'ARGS_SAFE',
  ATTACHMENT = 'ATTACHMENT',
  ATTACHMENT_LAST = 'ATTACHMENT_LAST',
  ATTACHMENT_SPOILER = 'ATTACHMENT_SPOILER',
  ATTACHMENT_TEXT = 'ATTACHMENT_TEXT',
  ATTACHMENT_VOICE = 'ATTACHMENT_VOICE',
  AVATAR = 'AVATAR',
  CHANNEL = 'CHANNEL',
  CHANNEL_ID = 'CHANNEL_ID',
  CHANNEL_MENTION = 'CHANNEL_MENTION',
  CHANNEL_RANDOM = 'CHANNEL_RANDOM',
  CHANNEL_RANDOM_ID = 'CHANNEL_RANDOM_ID',
  CHANNEL_RANDOM_MENTION = 'CHANNEL_RANDOM_MENTION',
  COMPONENT_JSON = 'COMPONENT_JSON',
  COMPONENTS_ON_TIMEOUT = 'COMPONENTS_ON_TIMEOUT',
  DISCORD = 'DISCORD',
  EMBED_JSON = 'EMBED_JSON',
  EVAL = 'EVAL',
  EVAL_SILENT = 'EVAL_SILENT',
  EXIT = 'EXIT',
  EXIT_SILENT = 'EXIT_SILENT',
  GUILD = 'GUILD',
  GUILD_COUNT = 'GUILD_COUNT',
  GUILD_ID = 'GUILD_ID',
  HASTEBIN = 'HASTEBIN',
  IMAGE_INTERROGATE = 'IMAGE_INTERROGATE',
  IMAGE_OCR = 'IMAGE_OCR',
  INSERT_BRACKET_LEFT = 'INSERT_BRACKET_LEFT',
  INSERT_BRACKET_RIGHT = 'INSERT_BRACKET_RIGHT',
  INSERT_NEWLINE = 'INSERT_NEWLINE',
  INSERT_SPLITTER_ARGUMENT = 'INSERT_SPLITTER_ARGUMENT',
  INSERT_SPLITTER_FUNCTION = 'INSERT_SPLITTER_FUNCTION',
  JSON_CHANNEL = 'JSON_CHANNEL',
  JSON_GUILD = 'JSON_GUILD',
  JSON_MEMBER = 'JSON_MEMBER',
  JSON_MEMBER_OR_USER = 'JSON_MEMBER_OR_USER',
  JSON_MESSAGE = 'JSON_MESSAGE',
  JSON_MESSAGE_REPLY = 'JSON_MESSAGE_REPLY',
  JSON_USER = 'JSON_USER',
  LOGICAL_AND = 'LOGICAL_AND',
  LOGICAL_DELETE = 'LOGICAL_DELETE',
  LOGICAL_DELETE_CHANNEL = 'LOGICAL_DELETE_CHANNEL',
  LOGICAL_DELETE_SERVER = 'LOGICAL_DELETE_SERVER',
  LOGICAL_DELETE_USER = 'LOGICAL_DELETE_USER',
  LOGICAL_FOR_EACH = 'LOGICAL_FOR_EACH',
  LOGICAL_GET = 'LOGICAL_GET',
  LOGICAL_GET_CHANNEL = 'LOGICAL_GET_CHANNEL',
  LOGICAL_GET_FILE_NAME = 'LOGICAL_GET_FILE_NAME',
  LOGICAL_GET_GLOBAL = 'LOGICAL_GET_GLOBAL',
  LOGICAL_GET_SERVER = 'LOGICAL_GET_SERVER',
  LOGICAL_GET_USER = 'LOGICAL_GET_USER',
  LOGICAL_INCLUDES = 'LOGICAL_INCLUDES',
  LOGICAL_IF = 'LOGICAL_IF',
  LOGICAL_IF_ERROR = 'LOGICAL_IF_ERROR',
  LOGICAL_IS_FROM_AI = 'LOGICAL_IS_FROM_AI',
  LOGICAL_IS_FROM_COMPONENT = 'LOGICAL_IS_FROM_COMPONENT',
  LOGICAL_IS_MAIN_TAG = 'LOGICAL_IS_MAIN_TAG',
  LOGICAL_OR = 'LOGICAL_OR',
  LOGICAL_SET = 'LOGICAL_SET',
  LOGICAL_SET_CHANNEL = 'LOGICAL_SET_CHANNEL',
  LOGICAL_SET_FILE_NAME = 'LOGICAL_SET_FILE_NAME',
  LOGICAL_SET_GLOBAL = 'LOGICAL_SET_GLOBAL',
  LOGICAL_SET_SERVER = 'LOGICAL_SET_SERVER',
  LOGICAL_SET_USER = 'LOGICAL_SET_USER',
  MATH = 'MATH',
  MATH_ABS = 'MATH_ABS',
  MATH_COS = 'MATH_COS',
  MATH_E = 'MATH_E',
  MATH_MAX = 'MATH_MAX',
  MATH_MIN = 'MATH_MIN',
  MATH_PI = 'MATH_PI',
  MATH_SIN = 'MATH_SIN',
  MATH_TAN = 'MATH_TAN',
  MEDIA = 'MEDIA',
  MEDIA_AUDIO = 'MEDIA_AUDIO',
  MEDIA_AUDIO_OR_VIDEO = 'MEDIA_AUDIO_OR_VIDEO',
  MEDIA_IMAGE = 'MEDIA_IMAGE',
  MEDIA_IMAGE_EDIT = 'MEDIA_IMAGE_EDIT',
  MEDIA_IMAGE_EDIT_URL = 'MEDIA_IMAGE_EDIT_URL',
  MEDIA_IMAGE_IMAGINE = 'MEDIA_IMAGE_IMAGINE',
  MEDIA_IMAGE_IMAGINE_URL = 'MEDIA_IMAGE_IMAGINE_URL',
  MEDIA_IMAGE_OR_VIDEO = 'MEDIA_IMAGE_OR_VIDEO',
  MEDIA_VIDEO = 'MEDIA_VIDEO',
  MEDIASCRIPT = 'MEDIASCRIPT',
  MEDIASCRIPT_MAYBE_URL = 'MEDIASCRIPT_MAYBE_URL',
  MEDIASCRIPT_URL = 'MEDIASCRIPT_URL',
  MESSAGE_CONTENT = 'MESSAGE_CONTENT',
  MESSAGE_LAST_ID = 'MESSAGE_LAST_ID',
  MESSAGE_RANDOM_ID = 'MESSAGE_RANDOM_ID',
  MESSAGE_USER_ID = 'MESSAGE_USER_ID',
  NSFW = 'NSFW',
  NSFW_FILTER = 'NSFW_FILTER',
  PAGE_JSON = 'PAGE_JSON',
  PREFIX = 'PREFIX',
  REPLY_CONTENT = 'REPLY_CONTENT',
  REPLY_USER_ID = 'REPLY_USER_ID',
  REQUEST = 'REQUEST',
  RNG_CHOOSE = 'RNG_CHOOSE',
  RNG_RANGE = 'RNG_RANGE',
  RNG_UUID = 'RNG_UUID',
  SEARCH_DUCKDUCKGO_IMAGES = 'SEARCH_DUCKDUCKGO_IMAGES',
  SEARCH_GOOGLE_IMAGES = 'SEARCH_GOOGLE_IMAGES',
  SEARCH_YOUTUBE = 'SEARCH_YOUTUBE',
  SETTINGS = 'SETTINGS',
  SETTINGS_SET_SERVER_AI_PERSONALITY = 'SETTINGS_SET_SERVER_AI_PERSONALITY',
  SETTINGS_SET_USER_AI_PERSONALITY = 'SETTINGS_SET_USER_AI_PERSONALITY',
  SETTINGS_SET_USER_LOCALE = 'SETTINGS_SET_USER_LOCALE',
  SETTINGS_SET_USER_TIMEZONE = 'SETTINGS_SET_USER_TIMEZONE',
  STRING_INDEX_OF = 'STRING_INDEX_OF',
  STRING_JSONIFY = 'STRING_JSONIFY',
  STRING_LENGTH = 'STRING_LENGTH',
  STRING_LOWER = 'STRING_LOWER',
  STRING_MARKUP_BOLD = 'STRING_MARKUP_BOLD',
  STRING_MARKUP_CODEBLOCK = 'STRING_MARKUP_CODEBLOCK',
  STRING_MARKUP_CODESTRING = 'STRING_MARKUP_CODESTRING',
  STRING_MARKUP_ESCAPE = 'STRING_MARKUP_ESCAPE',
  STRING_MARKUP_HEADER_BIG = 'STRING_MARKUP_HEADER_BIG',
  STRING_MARKUP_HEADER_MEDIUM = 'STRING_MARKUP_HEADER_MEDIUM',
  STRING_MARKUP_HEADER_SMALL = 'STRING_MARKUP_HEADER_SMALL',
  STRING_MARKUP_ITALICS = 'STRING_MARKUP_ITALICS',
  STRING_MARKUP_LIST_DOTTED = 'STRING_MARKUP_LIST_DOTTED',
  STRING_MARKUP_LIST_NUMBERED = 'STRING_MARKUP_LIST_NUMBERED',
  STRING_MARKUP_QUOTE = 'STRING_MARKUP_QUOTE',
  STRING_MARKUP_SPOILER = 'STRING_MARKUP_SPOILER',
  STRING_MARKUP_STRIKE = 'STRING_MARKUP_STRIKE',
  STRING_MARKUP_SUBTEXT = 'STRING_MARKUP_SUBTEXT',
  STRING_MARKUP_TIME = 'STRING_MARKUP_TIME',
  STRING_MARKUP_UNDERLINE = 'STRING_MARKUP_UNDERLINE',
  STRING_MARKUP_URL = 'STRING_MARKUP_URL',
  STRING_ONE_OF = 'STRING_ONE_OF',
  STRING_REPEAT = 'STRING_REPEAT',
  STRING_REPLACE = 'STRING_REPLACE',
  STRING_REVERSE = 'STRING_REVERSE',
  STRING_SUB = 'STRING_SUB',
  STRING_TRANSLATE = 'STRING_TRANSLATE',
  STRING_UPPER = 'STRING_UPPER',
  STRING_URL_ENCODE = 'STRING_URL_ENCODE',
  TAG = 'TAG',
  TAG_CONTENT = 'TAG_CONTENT',
  TAG_ID = 'TAG_ID',
  TAG_NAME = 'TAG_NAME',
  TAG_OWNER_ID = 'TAG_OWNER_ID',
  TEXT = 'TEXT',
  TEXT_FROM_HTML = 'TEXT_FROM_HTML',
  TIME_UNIX = 'TIME_UNIX',
  TIME_UNIX_FROM_SNOWFLAKE = 'TIME_UNIX_FROM_SNOWFLAKE',
  TIME_UNIX_SECONDS = 'TIME_UNIX_SECONDS',
  TRANSCRIBE = 'TRANSCRIBE',
  TRAVERSE_JSON = 'TRAVERSE_JSON',
  TYPE = 'TYPE',
  USER_AVATAR = 'USER_AVATAR',
  USER_DISCRIMINATOR = 'USER_DISCRIMINATOR',
  USER_ID = 'USER_ID',
  USER_MENTION = 'USER_MENTION',
  USER_NAME = 'USER_NAME',
  USER_NICK = 'USER_NICK',
  USER_RANDOM = 'USER_RANDOM',
  USER_RANDOM_ID = 'USER_RANDOM_ID',
  USER_RANDOM_ONLINE = 'USER_RANDOM_ONLINE',
  USER_RANDOM_ONLINE_ID = 'USER_RANDOM_ONLINE_ID',
  USER_RANDOM_ONLINE_TAG = 'USER_RANDOM_ONLINE_TAG',
  USER_RANDOM_TAG = 'USER_RANDOM_TAG',
  USER_STATUS = 'USER_STATUS',
  USER_TAG = 'USER_TAG',
  VARIABLES = 'VARIABLES',
  VARIABLES_CHANNEL = 'VARIABLES_CHANNEL',
  VARIABLES_GLOBAL = 'VARIABLES_GLOBAL',
  VARIABLES_SERVER = 'VARIABLES_SERVER',
  VARIABLES_USER = 'VARIABLES_USER',
}


export const TagFunctionsToString = Object.freeze({
  IGNORE: ['ignore'],
  NOTE: ['note'],

  [TagFunctions.AI]: ['ai'],
  [TagFunctions.API_CREATE_REMINDER]: ['api.create.reminder'],
  [TagFunctions.API_DELETE_REMINDER]: ['api.delete.reminder'],
  [TagFunctions.API_EDIT_REMINDER]: ['api.edit.reminder'],
  [TagFunctions.API_FETCH_REMINDERS]: ['api.fetch.reminders'],
  [TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES]: ['api.search.duckduckgo.images'],
  [TagFunctions.API_SEARCH_IMGUR]: ['api.search.imgur'],
  [TagFunctions.API_UTILITIES_LOCATIONS]: ['api.utilities.locations'],
  [TagFunctions.API_UTILITIES_QR_CREATE]: ['api.utilities.qr.create'],
  [TagFunctions.API_UTILITIES_QR_SCAN]: ['api.utilities.qr.scan'],
  [TagFunctions.API_UTILITIES_SCREENSHOT]: ['api.utilities.screenshot'],
  [TagFunctions.API_UTILITIES_WEATHER]: ['api.utilities.weather'],
  [TagFunctions.ARG]: ['arg'],
  [TagFunctions.ARG_SAFE]: ['argsafe'],
  [TagFunctions.ARGS]: ['args'],
  [TagFunctions.ARGS_LEN]: ['argslen'],
  [TagFunctions.ARGS_SAFE]: ['argssafe'],
  [TagFunctions.ATTACHMENT]: ['attachment', 'attach', 'file'],
  [TagFunctions.ATTACHMENT_LAST]: ['last_attachment', 'lastattachment', 'lattachment', 'lattach'],
  [TagFunctions.ATTACHMENT_SPOILER]: ['attachmentspoiler', 'attachspoiler', 'filespoiler'],
  [TagFunctions.ATTACHMENT_TEXT]: ['attachmenttext', 'attachtext', 'filetext'],
  [TagFunctions.ATTACHMENT_VOICE]: ['attachmentvoice', 'attachvoice', 'filevoice'],
  [TagFunctions.AVATAR]: ['avatar'],
  [TagFunctions.CHANNEL]: ['channel'],
  [TagFunctions.CHANNEL_ID]: ['channelid'],
  [TagFunctions.CHANNEL_MENTION]: ['channelmention'],
  [TagFunctions.CHANNEL_RANDOM]: ['randchannel'],
  [TagFunctions.CHANNEL_RANDOM_ID]: ['randchannelid'],
  [TagFunctions.CHANNEL_RANDOM_MENTION]: ['randchannelmention'],
  [TagFunctions.COMPONENT_JSON]: ['componentjson'],
  [TagFunctions.COMPONENTS_ON_TIMEOUT]: ['componentsontimeout'],
  [TagFunctions.DISCORD]: ['discord'],
  [TagFunctions.EMBED_JSON]: ['embedjson'],
  [TagFunctions.EVAL]: ['eval'],
  [TagFunctions.EVAL_SILENT]: ['evalsilent'],
  [TagFunctions.EXIT]: ['exit'],
  [TagFunctions.EXIT_SILENT]: ['exitsilent'],
  [TagFunctions.GUILD]: ['guild', 'server'],
  [TagFunctions.GUILD_COUNT]: ['guildcount', 'membercount', 'servercount'],
  [TagFunctions.GUILD_ID]: ['guildid', 'serverid', 'sid', 'gid'],
  [TagFunctions.HASTEBIN]: ['hastebin', 'haste'],
  [TagFunctions.IMAGE_INTERROGATE]: ['identify', 'interrogate'],
  [TagFunctions.IMAGE_OCR]: ['ocr'],
  [TagFunctions.INSERT_BRACKET_LEFT]: ['bracketleft'],
  [TagFunctions.INSERT_BRACKET_RIGHT]: ['bracketright'],
  [TagFunctions.INSERT_NEWLINE]: ['newline'],
  [TagFunctions.INSERT_SPLITTER_ARGUMENT]: ['splitterargument'],
  [TagFunctions.INSERT_SPLITTER_FUNCTION]: ['splitterfunction'],
  [TagFunctions.JSON_CHANNEL]: ['json.channel', 'channeljson'],
  [TagFunctions.JSON_GUILD]: ['json.guild'],
  [TagFunctions.JSON_MEMBER]: ['json.member'],
  [TagFunctions.JSON_MEMBER_OR_USER]: ['json.memberoruser'],
  [TagFunctions.JSON_MESSAGE]: ['json.message'],
  [TagFunctions.JSON_MESSAGE_REPLY]: ['json.messagereply'],
  [TagFunctions.JSON_USER]: ['json.user', 'userjson'],
  [TagFunctions.LOGICAL_AND]: ['and'],
  [TagFunctions.LOGICAL_DELETE]: ['delete'],
  [TagFunctions.LOGICAL_DELETE_CHANNEL]: ['deletechannel'],
  [TagFunctions.LOGICAL_DELETE_SERVER]: ['deleteserver'],
  [TagFunctions.LOGICAL_DELETE_USER]: ['deleteuser'],
  [TagFunctions.LOGICAL_FOR_EACH]: ['foreach'],
  [TagFunctions.LOGICAL_GET]: ['get'],
  [TagFunctions.LOGICAL_GET_CHANNEL]: ['getchannel'],
  [TagFunctions.LOGICAL_GET_FILE_NAME]: ['getfilename'],
  [TagFunctions.LOGICAL_GET_GLOBAL]: ['getglobal'],
  [TagFunctions.LOGICAL_GET_SERVER]: ['getserver'],
  [TagFunctions.LOGICAL_GET_USER]: ['getuser'],
  [TagFunctions.LOGICAL_INCLUDES]: ['includes'],
  [TagFunctions.LOGICAL_IF]: ['if'],
  [TagFunctions.LOGICAL_IF_ERROR]: ['iferror'],
  [TagFunctions.LOGICAL_IS_FROM_AI]: ['isfromai'],
  [TagFunctions.LOGICAL_IS_FROM_COMPONENT]: ['isfromcomponent'],
  [TagFunctions.LOGICAL_IS_MAIN_TAG]: ['ismaintag'],
  [TagFunctions.LOGICAL_OR]: ['or'],
  [TagFunctions.LOGICAL_SET]: ['set'],
  [TagFunctions.LOGICAL_SET_CHANNEL]: ['setchannel'],
  [TagFunctions.LOGICAL_SET_FILE_NAME]: ['setfilename'],
  [TagFunctions.LOGICAL_SET_GLOBAL]: ['setglobal'],
  [TagFunctions.LOGICAL_SET_SERVER]: ['setserver'],
  [TagFunctions.LOGICAL_SET_USER]: ['setuser'],
  [TagFunctions.MATH]: ['math'],
  [TagFunctions.MATH_ABS]: ['abs'],
  [TagFunctions.MATH_COS]: ['cos'],
  [TagFunctions.MATH_E]: ['e'],
  [TagFunctions.MATH_MAX]: ['max'],
  [TagFunctions.MATH_MIN]: ['min'],
  [TagFunctions.MATH_PI]: ['pi'],
  [TagFunctions.MATH_SIN]: ['sin'],
  [TagFunctions.MATH_TAN]: ['tan'],
  [TagFunctions.MEDIA]: ['media'],
  [TagFunctions.MEDIA_AUDIO]: ['audio'],
  [TagFunctions.MEDIA_AUDIO_OR_VIDEO]: ['av'],
  [TagFunctions.MEDIA_IMAGE]: ['image'],
  [TagFunctions.MEDIA_IMAGE_EDIT]: ['edit'],
  [TagFunctions.MEDIA_IMAGE_EDIT_URL]: ['editurl'],
  [TagFunctions.MEDIA_IMAGE_IMAGINE]: ['imagine'],
  [TagFunctions.MEDIA_IMAGE_IMAGINE_URL]: ['imagineurl'],
  [TagFunctions.MEDIA_IMAGE_OR_VIDEO]: ['iv'],
  [TagFunctions.MEDIASCRIPT]: ['mediascript', 'mscript', 'imagescript', 'iscript'],
  [TagFunctions.MEDIASCRIPT_MAYBE_URL]: ['mediascriptmaybeurl', 'mscriptmaybeurl', 'imagescriptmaybeurl', 'iscriptmaybeurl'],
  [TagFunctions.MEDIASCRIPT_URL]: ['mediascripturl', 'mscripturl', 'imagescripturl', 'iscripturl'],
  [TagFunctions.MEDIA_VIDEO]: ['video'],
  [TagFunctions.MESSAGE_CONTENT]: ['messagecontent'],
  [TagFunctions.MESSAGE_LAST_ID]: ['messagelastid'],
  [TagFunctions.MESSAGE_RANDOM_ID]: ['randmessageid'],
  [TagFunctions.MESSAGE_USER_ID]: ['messageuserid'],
  [TagFunctions.NSFW]: ['nsfw'],
  [TagFunctions.NSFW_FILTER]: ['nsfwfilter'],
  [TagFunctions.PAGE_JSON]: ['pagejson'],
  [TagFunctions.PREFIX]: ['prefix'],
  [TagFunctions.REPLY_CONTENT]: ['replycontent'],
  [TagFunctions.REPLY_USER_ID]: ['replyuserid'],
  [TagFunctions.REQUEST]: ['request'],
  [TagFunctions.RNG_CHOOSE]: ['choose'],
  [TagFunctions.RNG_RANGE]: ['range', 'random', 'rnd'],
  [TagFunctions.RNG_UUID]: ['uuid'],
  [TagFunctions.SEARCH_DUCKDUCKGO_IMAGES]: ['search.duckduckgo.images', 'search.ddg.images', 's.duckduckgo.images', 's.ddg.images'],
  [TagFunctions.SEARCH_GOOGLE_IMAGES]: ['search.google.images', 'search.g.images', 's.google.images', 's.g.images'],
  [TagFunctions.SEARCH_YOUTUBE]: ['search.youtube', 'search.yt', 's.youtube', 's.yt'],
  [TagFunctions.SETTINGS]: ['settings'],
  [TagFunctions.SETTINGS_SET_SERVER_AI_PERSONALITY]: ['settings.set.server.ai.personality'],
  [TagFunctions.SETTINGS_SET_USER_AI_PERSONALITY]: ['settings.set.user.ai.personality'],
  [TagFunctions.SETTINGS_SET_USER_LOCALE]: ['settings.set.user.locale'],
  [TagFunctions.SETTINGS_SET_USER_TIMEZONE]: ['settings.set.user.timezone'],
  [TagFunctions.STRING_INDEX_OF]: ['indexof'],
  [TagFunctions.STRING_JSONIFY]: ['jsonify'],
  [TagFunctions.STRING_LENGTH]: ['len', 'length'],
  [TagFunctions.STRING_LOWER]: ['lower'],
  [TagFunctions.STRING_MARKUP_BOLD]: ['markupbold'],
  [TagFunctions.STRING_MARKUP_CODEBLOCK]: ['code', 'markupcodeblock'],
  [TagFunctions.STRING_MARKUP_CODESTRING]: ['markupcodestring'],
  [TagFunctions.STRING_MARKUP_ESCAPE]: ['markupescape'],
  [TagFunctions.STRING_MARKUP_HEADER_BIG]: ['markupheaderbig'],
  [TagFunctions.STRING_MARKUP_HEADER_MEDIUM]: ['markupheadermedium'],
  [TagFunctions.STRING_MARKUP_HEADER_SMALL]: ['markupheadersmall'],
  [TagFunctions.STRING_MARKUP_ITALICS]: ['markupitalics'],
  [TagFunctions.STRING_MARKUP_LIST_DOTTED]: ['markuplistdotted'],
  [TagFunctions.STRING_MARKUP_LIST_NUMBERED]: ['markuplistnumbered'],
  [TagFunctions.STRING_MARKUP_QUOTE]: ['markupquote'],
  [TagFunctions.STRING_MARKUP_SPOILER]: ['markupspoiler'],
  [TagFunctions.STRING_MARKUP_STRIKE]: ['markupstrike'],
  [TagFunctions.STRING_MARKUP_SUBTEXT]: ['markupsubtext'],
  [TagFunctions.STRING_MARKUP_TIME]: ['markuptime'],
  [TagFunctions.STRING_MARKUP_UNDERLINE]: ['markupunderline'],
  [TagFunctions.STRING_MARKUP_URL]: ['markupurl'],
  [TagFunctions.STRING_ONE_OF]: ['oneof'],
  [TagFunctions.STRING_REPEAT]: ['repeat'],
  [TagFunctions.STRING_REPLACE]: ['replace', 'replaceregex'],
  [TagFunctions.STRING_REVERSE]: ['reverse'],
  [TagFunctions.STRING_SUB]: ['substring'],
  [TagFunctions.STRING_TRANSLATE]: ['translate'],
  [TagFunctions.STRING_UPPER]: ['upper'],
  [TagFunctions.STRING_URL_ENCODE]: ['url', 'urlencode'],
  [TagFunctions.TAG]: ['tag'],
  [TagFunctions.TAG_CONTENT]: ['tagcontent'],
  [TagFunctions.TAG_ID]: ['tagid'],
  [TagFunctions.TAG_NAME]: ['tagname'],
  [TagFunctions.TAG_OWNER_ID]: ['tagownerid'],
  [TagFunctions.TEXT]: ['download', 'text'],
  [TagFunctions.TEXT_FROM_HTML]: ['downloadfromhtml', 'textfromhtml'],
  [TagFunctions.TIME_UNIX]: ['unix'],
  [TagFunctions.TIME_UNIX_FROM_SNOWFLAKE]: ['unixsnowflake'],
  [TagFunctions.TIME_UNIX_SECONDS]: ['unixs'],
  [TagFunctions.TRANSCRIBE]: ['transcribe'],
  [TagFunctions.TRAVERSE_JSON]: ['traversejson'],
  [TagFunctions.TYPE]: ['type'],
  [TagFunctions.USER_AVATAR]: ['useravatar'],
  [TagFunctions.USER_DISCRIMINATOR]: ['userdiscriminator', 'userdiscrim', 'discrim'],
  [TagFunctions.USER_ID]: ['userid', 'id'],
  [TagFunctions.USER_MENTION]: ['usermention', 'mention'],
  [TagFunctions.USER_NAME]: ['username', 'name', 'user'],
  [TagFunctions.USER_NICK]: ['usernick', 'nick'],
  [TagFunctions.USER_RANDOM]: ['randomuser', 'randuser'],
  [TagFunctions.USER_RANDOM_ID]: ['randomuserid', 'randuserid'],
  [TagFunctions.USER_RANDOM_ONLINE]: ['randomonline', 'randonline'],
  [TagFunctions.USER_RANDOM_ONLINE_ID]: ['randomonlineid', 'randonlineid'],
  [TagFunctions.USER_RANDOM_ONLINE_TAG]: ['randomonlinetag', 'randonlinetag'],
  [TagFunctions.USER_RANDOM_TAG]: ['randomusertag', 'randusertag'],
  [TagFunctions.USER_STATUS]: ['userstatus'],
  [TagFunctions.USER_TAG]: ['usertag'],
  [TagFunctions.VARIABLES]: ['variables'],
  [TagFunctions.VARIABLES_CHANNEL]: ['variableschannel'],
  [TagFunctions.VARIABLES_GLOBAL]: ['variablesglobal'],
  [TagFunctions.VARIABLES_SERVER]: ['variablesserver'],
  [TagFunctions.VARIABLES_USER]: ['variablesuser'],
});


export enum TagSettings {
  AI_MODEL = 'AI_MODEL',
  AI_PERSONALITY = 'AI_PERSONALITY',
  ALLOW_COMPONENT_EXECUTIONS_FROM_EVERYONE = 'ALLOW_COMPONENT_EXECUTIONS_FROM_EVERYONE',
  DISPLAY_MEDIA_AS_NATIVE = 'DISPLAY_MEDIA_AS_NATIVE',
  MEDIA_AV_FALLBACK = 'MEDIA_AV_FALLBACK',
  MEDIA_IV_FALLBACK = 'MEDIA_IV_FALLBACK',
  ML_IMAGINE_DO_NOT_ERROR = 'ML_IMAGINE_DO_NOT_ERROR',
  ML_IMAGINE_MODEL = 'ML_IMAGINE_MODEL',
}


export interface TagVariables {
  [PrivateVariables.AI_EXECUTIONS]: number,
  [PrivateVariables.API_MANIPULATIONS]: number,
  [PrivateVariables.ARGS]: Array<string>,
  [PrivateVariables.ARGS_STRING]: string,
  [PrivateVariables.COMPONENT_EXECUTIONS]: number,
  [PrivateVariables.FILE_SIZE]: number,
  [PrivateVariables.IS_FROM_AI]: number,
  [PrivateVariables.IS_FROM_CHILD_PARSING]: number,
  [PrivateVariables.ITERATIONS_REMAINING]: number,
  [PrivateVariables.NETWORK_REQUESTS]: number,
  [PrivateVariables.NETWORK_REQUESTS_ML]: number,
  [PrivateVariables.NETWORK_REQUESTS_SAFETY]: number,
  [PrivateVariables.PARENT_TAG_ID]: string,
  [PrivateVariables.RESULTS]: {
    [TagFunctions.AI]?: RestResponsesRaw.GenerateTag,
    [TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES]?: Record<string, RestResponsesRaw.SearchDuckDuckGoImages>,
    [TagFunctions.API_SEARCH_IMGUR]?: Record<string, RestResponsesRaw.SearchImgur>,
    [TagFunctions.API_UTILITIES_LOCATIONS]?: Record<string, RestResponsesRaw.UtilitiesLocations>,
    [TagFunctions.API_UTILITIES_WEATHER]?: Record<string, RestResponsesRaw.UtilitiesWeather>,
    [TagFunctions.ATTACHMENT]?: Record<string, RestResponsesRaw.FileResponse>,
    [TagFunctions.SEARCH_GOOGLE_IMAGES]?: Record<string, RestResponses.SearchGoogleImages>,
    [TagFunctions.SEARCH_YOUTUBE]?: Record<string, RestResponsesRaw.SearchYoutube>,
  },
  [PrivateVariables.SETTINGS]: {
    [TagSettings.AI_MODEL]?: string,
    [TagSettings.AI_PERSONALITY]?: string,
    [TagSettings.ALLOW_COMPONENT_EXECUTIONS_FROM_EVERYONE]?: boolean,
    [TagSettings.DISPLAY_MEDIA_AS_NATIVE]?: boolean,
    [TagSettings.MEDIA_AV_FALLBACK]?: TagFunctions.SEARCH_YOUTUBE,
    [TagSettings.MEDIA_IV_FALLBACK]?: TagFunctions.MEDIA_IMAGE_IMAGINE_URL | TagFunctions.SEARCH_DUCKDUCKGO_IMAGES | TagFunctions.SEARCH_GOOGLE_IMAGES,
    [TagSettings.ML_IMAGINE_DO_NOT_ERROR]?: boolean,
    [TagSettings.ML_IMAGINE_MODEL]?: MLDiffusionModels,
  },
  [PrivateVariables.TAG_EXECUTIONS]: number,
  [key: string]: number | string | Array<string> | Record<string, any>,
}

export interface TagContext {
  mathWorker?: MathWorker,
}

export interface TagResultComponents {
  components: Array<any>,
  onTimeout?: string,
}

export interface TagResult {
  components: TagResultComponents | null,
  context: TagContext,
  embeds: Array<Embed>,
  files: Array<{
    buffer: null | string | Buffer,
    deleted?: boolean,
    description?: string,
    durationSecs?: number,
    filename: string,
    spoiler?: boolean,
    waveform?: string,
    url: string,
  }>,
  limits: TagLimits,
  pages: Array<PageObject & {filenames?: Array<string>}>,
  replacement: string | null,
  text: string,
  // for error messages, in the language of whoever is running the tag
  translate: Translator['translate'],
  // whether `\{`, `\}` and `\|` in this script's own text become the literal characters, see `ParseOptions`
  unescapesText: boolean,
  variables: TagVariables,
}

export interface ParseOptions {
  // a separate script that shares the tag's variables, like a button's or the timeout's script. it gets the same
  // treatment as the tag itself: its text is unescaped and `{exit}` ends it instead of erroring
  isRoot?: boolean,
  // a called tag (`{tag:name}`) whose output goes straight into the caller's text, it's unescaped like the caller's
  // own text would be. `{exit}` still stops the caller too
  unescapeText?: boolean,
}

export async function parse(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  args: string = '',
  variables: TagVariables = Object.create(null),
  tagContext: TagContext = Object.create(null),
  limits: Partial<TagLimits> = Object.create(null),
  files: Array<{
    buffer: null | string | Buffer,
    deleted?: boolean,
    description?: string,
    durationSecs?: number,
    filename: string,
    spoiler?: boolean,
    waveform?: string,
    url: string,
  }> = [],
  shouldTrim: boolean = true,
  parseOptions: ParseOptions = {},
): Promise<TagResult> {
  const tagLimits: TagLimits = Object.assign({}, TagLimitDefaults);
  for (let key in limits) {
    if (key in tagLimits) {
      (tagLimits as any)[key] = (limits as any)[key];
    }
  }

  // shared variables mean this is a function's argument, a called tag, or a button/timeout script. only the last kind
  // is treated like the tag itself (they used to all be treated like arguments)
  // callers like NotSoAI's tag generation pass a plain `{...}`, where `key in variables` also finds the prototype's
  // properties (`{get:constructor}` printed `function Object()...`). variables never need a prototype
  if (Object.getPrototypeOf(variables) !== null) {
    Object.setPrototypeOf(variables, null);
  }
  const hasSharedVariables = PrivateVariables.ITERATIONS_REMAINING in variables;
  const isFirstParse = !hasSharedVariables || !!parseOptions.isRoot;
  if (!hasSharedVariables) {
    (variables as any)[PrivateVariables.ITERATIONS_REMAINING] = tagLimits.MAX_ITERATIONS;
    (variables as any)[PrivateVariables.ARGS_STRING] = args;
    (variables as any)[PrivateVariables.ARGS] = Parameters.stringArguments(args);
  }
  if (!(PrivateVariables.AI_EXECUTIONS in variables)) {
    (variables as any)[PrivateVariables.AI_EXECUTIONS] = 0;
  }
  if (!(PrivateVariables.API_MANIPULATIONS in variables)) {
    (variables as any)[PrivateVariables.API_MANIPULATIONS] = 0;
  }
  if (!(PrivateVariables.COMPONENT_EXECUTIONS in variables)) {
    (variables as any)[PrivateVariables.COMPONENT_EXECUTIONS] = 0;
  }
  if (!(PrivateVariables.FILE_SIZE in variables)) {
    (variables as any)[PrivateVariables.FILE_SIZE] = 0;
  }
  if (!(PrivateVariables.IS_FROM_AI in variables)) {
    (variables as any)[PrivateVariables.IS_FROM_AI] = 0;
  }
  if (!(PrivateVariables.IS_FROM_CHILD_PARSING in variables)) {
    (variables as any)[PrivateVariables.IS_FROM_CHILD_PARSING] = 0;
  }
  if (!(PrivateVariables.NETWORK_REQUESTS in variables)) {
    (variables as any)[PrivateVariables.NETWORK_REQUESTS] = 0;
  }
  if (!(PrivateVariables.NETWORK_REQUESTS_ML in variables)) {
    (variables as any)[PrivateVariables.NETWORK_REQUESTS_ML] = 0;
  }
  if (!(PrivateVariables.NETWORK_REQUESTS_SAFETY in variables)) {
    (variables as any)[PrivateVariables.NETWORK_REQUESTS_SAFETY] = 0;
  }
  if (!(PrivateVariables.PARENT_TAG_ID in variables)) {
    (variables as any)[PrivateVariables.PARENT_TAG_ID] = '';
  }
  if (!(PrivateVariables.RESULTS in variables)) {
    (variables as any)[PrivateVariables.RESULTS] = {};
  }
  if (!(PrivateVariables.SETTINGS in variables)) {
    (variables as any)[PrivateVariables.SETTINGS] = {};
  }
  if (!(PrivateVariables.SYNC_TIME in variables)) {
    (variables as any)[PrivateVariables.SYNC_TIME] = 0;
  }
  if (!(PrivateVariables.TAG_EXECUTIONS in variables)) {
    (variables as any)[PrivateVariables.TAG_EXECUTIONS] = 0;
  }

  let replacement: string | null = null;
  if (!hasSharedVariables) {
    // go through the text and replace

    const expired = new Set<string>();
    // go through them all and see if they are expired, if so then replace
    for (let match of value.matchAll(ATTACHMENT_URL_REGEX)) {
      if (!isValidAttachmentUrl(match[0])) {
        expired.add(match[0]);
      }
    }

    for (let match of args.matchAll(ATTACHMENT_URL_REGEX)) {
      if (!isValidAttachmentUrl(match[0])) {
        expired.add(match[0]);
      }
    }

    // discord refreshes 50 urls per request. this used to skip refreshing entirely past 50, only replaced the first
    // occurrence of each url, didn't count as a network request and failed the whole tag if discord errored
    const oldValue = value;
    const urls = Array.from(expired).slice(0, ATTACHMENT_REFRESH_MAX_URLS);
    for (let i = 0; i < urls.length; i += ATTACHMENT_REFRESH_CHUNK_SIZE) {
      if (tagLimits.MAX_NETWORK_REQUESTS <= (variables as any)[PrivateVariables.NETWORK_REQUESTS]) {
        break;
      }
      (variables as any)[PrivateVariables.NETWORK_REQUESTS] += 1;

      let refreshedUrls: Array<{original: string, refreshed: string}> = [];
      try {
        ({ refreshed_urls: refreshedUrls } = await context.rest.request({
          body: {attachment_urls: urls.slice(i, i + ATTACHMENT_REFRESH_CHUNK_SIZE)},
          route: {
            method: 'post',
            path: '/attachments/refresh-urls',
          },
        }));
      } catch(error) {
        // the urls just stay expired
        break;
      }
      for (let item of refreshedUrls) {
        value = value.split(item.original).join(item.refreshed);
        args = args.split(item.original).join(item.refreshed);
      }
    }
    if (oldValue !== value) {
      replacement = value;
    }
    if ((variables as any)[PrivateVariables.ARGS_STRING] !== args) {
      (variables as any)[PrivateVariables.ARGS_STRING] = args;
      (variables as any)[PrivateVariables.ARGS] = Parameters.stringArguments(args);
    }
  }

  const tag: TagResult = {
    components: null,
    context: tagContext,
    embeds: [],
    files,
    limits: tagLimits,
    pages: [],
    replacement,
    text: '',
    translate: getCachedTranslator(context).translate,
    unescapesText: isFirstParse || !!parseOptions.unescapeText,
    variables,
  };
  tag.variables[PrivateVariables.ITERATIONS_REMAINING]--;

  const maxTextLength = getMaxTextLength(context, tag);

  let depth = 0;
  let scriptBuffer = '';
  let position = 0;
  while (position < value.length) {
    if (maxTextLength < tag.text.length) {
      throw new Error(getCachedTranslator(context).translate('tagscript.text_exceeded_bytes', {max: maxTextLength}));
    }

    if (tag.variables[PrivateVariables.ITERATIONS_REMAINING] <= 0) {
      tag.text += value.slice(position);
      position = value.length;
      continue;
    }

    if (depth === 0) {
      // in the main tag's own text (not inside a function), `\{`, `\}` and `\|` output the literal character and `\{` does not start a function
      // arguments keep their escapes as-is since `split()` and functions like {replace} rely on them
      const shouldUnescape = tag.unescapesText;

      // find next left bracket
      let nextLeftBracket = value.indexOf(TagSymbols.BRACKET_LEFT, position);
      if (shouldUnescape) {
        while (nextLeftBracket !== -1 && position < nextLeftBracket && value[nextLeftBracket - 1] === TagSymbols.IGNORE) {
          nextLeftBracket = value.indexOf(TagSymbols.BRACKET_LEFT, nextLeftBracket + 1);
        }
      }

      let text = (nextLeftBracket === -1) ? value.slice(position) : value.slice(position, nextLeftBracket);
      if (shouldUnescape && text.includes(TagSymbols.IGNORE)) {
        text = text.replace(REGEX_BRACKET_OR_SPLITTER_ESCAPE_REPLACEMENT, '$1');
      }
      tag.text += text;

      if (nextLeftBracket === -1) {
        position = value.length;
        continue;
      }
      position = nextLeftBracket;
    }

    increaseAIExecutions(tag, 0);
    increaseAPIManipulations(tag, 0);
    increaseComponentExecutions(tag, 0);
    increaseNetworkRequests(tag, 0);
    increaseNetworkRequestsML(tag, 0);
    increaseNetworkRequestsSafety(tag, 0);
    increaseTagExecutions(tag, 0);

    // add network checks
    try {
      let result = value.slice(position, ++position);
      scriptBuffer += result;
      switch (result) {
        case TagSymbols.IGNORE: {
          const nextValue = value.slice(position, position + 1);
          if (nextValue === TagSymbols.BRACKET_LEFT) {
            depth--;
          } else if (nextValue === TagSymbols.BRACKET_RIGHT) {
            depth++;
          }
        }; break;
        case TagSymbols.BRACKET_LEFT: {
          // start of the script
          depth++;
        }; break;
        case TagSymbols.BRACKET_RIGHT: {
          // end of the script
          depth--;
          if (depth <= 0) {
            let [scriptName, arg] = parseInnerScript(scriptBuffer, shouldTrim);
            if (TagFunctionsToString.EVAL_SILENT.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.EVAL_SILENT](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.IGNORE.includes(scriptName)) {
              tag.text += arg;
            } else if (TagFunctionsToString.NOTE.includes(scriptName)) {
              // do nothing
            } else if (TagFunctionsToString.LOGICAL_AND.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_AND](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_FOR_EACH.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_FOR_EACH](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_GET.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_GET](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_GET_CHANNEL.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_GET_CHANNEL](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_GET_GLOBAL.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_GET_GLOBAL](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_GET_SERVER.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_GET_SERVER](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_GET_USER.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_GET_USER](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_INCLUDES.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_INCLUDES](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_IF.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_IF](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_IF_ERROR.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_IF_ERROR](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_OR.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_OR](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_SET.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_SET](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_SET_CHANNEL.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_SET_CHANNEL](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_SET_FILE_NAME.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_SET_FILE_NAME](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_SET_GLOBAL.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_SET_GLOBAL](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_SET_SERVER.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_SET_SERVER](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.LOGICAL_SET_USER.includes(scriptName)) {
              // do this separate because we dont want to parse args yet
              const wasValid = await ScriptTags[TagFunctions.LOGICAL_SET_USER](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.RNG_CHOOSE.includes(scriptName)) {
              // do this separate from below because we don't want our args parsed yet
              const wasValid = await ScriptTags[TagFunctions.RNG_CHOOSE](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.STRING_INDEX_OF.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.STRING_INDEX_OF](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.STRING_SUB.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.STRING_SUB](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.COMPONENT_JSON.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.COMPONENT_JSON](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else if (TagFunctionsToString.COMPONENTS_ON_TIMEOUT.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.COMPONENTS_ON_TIMEOUT](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else {
              // check the other tags now
              let codeLanguage = getCodeLanguage(scriptName);
              // restore whatever it was before, not 0 (that let `{tag}` run inside of a {componentjson} after a code block)
              // and in a finally, so an error inside of {iferror} can't leave it set and block every later {tag}
              const wasChildParsing = tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING];
              if (codeLanguage) {
                // check code languages first to stop {tag} parsing
                tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING] = 1;
              }

              let text: string;
              try {
                text = await parseValue(context, tag, arg);
              } finally {
                tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING] = wasChildParsing;
              }
              if (arg !== text) {
                arg = text;
                const firstSplitter = scriptBuffer.indexOf(TagSymbols.SPLITTER_FUNCTION);
                if (firstSplitter !== -1) {
                  scriptBuffer = scriptBuffer.slice(0, firstSplitter) + TagSymbols.SPLITTER_FUNCTION + arg + TagSymbols.BRACKET_RIGHT;
                }
              }

              let found = !!codeLanguage;
              if (codeLanguage) {
                const wasValid = await ScriptTags._code(context, arg, tag, codeLanguage.language, codeLanguage.version);
                if (!wasValid) {
                  tag.text += scriptBuffer;
                }
              }

              if (!found) {
                for (let TAG_FUNCTION of Object.values(TagFunctions)) {
                  if (TagFunctionsToString[TAG_FUNCTION].includes(scriptName)) {
                    found = true;
                    const wasValid = await ScriptTags[TAG_FUNCTION](context, arg, tag);
                    if (!wasValid) {
                      tag.text += scriptBuffer;
                    }
                    break;
                  }
                }
              }

              if (!found) {
                tag.text += scriptBuffer;
              }
            }

            scriptBuffer = '';
          }
        }; break;
      }
    } catch(error) {
      if (isFirstParse && error instanceof TagExitError) {
        if (error.isSilent) {
          tag.text += error.message;
        } else {
          tag.components = null;
          tag.embeds = (tag.embeds.length) ? [] : tag.embeds;
          tag.files = (tag.files.length) ? [] : tag.files;
          tag.pages = (tag.pages.length) ? [] : tag.pages;
          tag.text = error.message || 'Tag Exited';
        }
        scriptBuffer = '';
        break;
      } else {
        throw error;
      }
    }
  }

  tag.text = (tag.text + scriptBuffer);
  if (isFirstParse) {
    tag.text = tag.text.replace(REGEX_NEWLINE_SENTINEL, '\n');
  }
  return tag;
}


// discord limits the whole message, not just each file. the old running total (`FILE_SIZE`) never went down when a
// file was used up by a mediascript/code call, so this checks the files the message will actually carry
function assertTotalFileSize(context: Command.Context | Interaction.InteractionContext, tag: TagResult, adding: number): void {
  const maxFileSize = context.maxAttachmentSize;
  let total = adding;
  for (let file of tag.files) {
    if (!file.deleted && file.buffer) {
      total += (typeof(file.buffer) === 'string') ? Buffer.byteLength(file.buffer) : file.buffer.length;
    }
  }
  if (maxFileSize < total) {
    throw new Error(tag.translate('tagscript.attachments_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
  }
}


const ATTACHMENT_REFRESH_CHUNK_SIZE = 50;
const ATTACHMENT_REFRESH_MAX_URLS = 200;


// sets a variable from data (not tagscript), with the same limits `{set}` has
function setVariableRaw(tag: TagResult, key: string, value: any): void {
  if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
    return;
  }
  if (tag.limits.MAX_VARIABLE_KEY_LENGTH < key.length) {
    throw new Error(tag.translate('tagscript.variable_cannot_be_more_than_characters', {max: tag.limits.MAX_VARIABLE_KEY_LENGTH}));
  }
  if (!(key in tag.variables)) {
    if (tag.limits.MAX_VARIABLES <= Object.keys(tag.variables).filter((x) => !x.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
      throw new Error(tag.translate('tagscript.reached_max_variable_amount_max_variables', {max: tag.limits.MAX_VARIABLES.toLocaleString()}));
    }
  }
  tag.variables[key] = stringifyStorageValue(value).slice(0, tag.limits.MAX_VARIABLE_LENGTH).trim();
}


// `load FILE_n NAME` lines in code: files with a buffer are sent as uploads (and the line dropped), url-only files get
// their url. a second line for the same file used to be dropped entirely, so its name never existed in the code
function collectCodeFiles(tag: TagResult, urls: Record<string, {filename?: string, url: string}>): Array<RequestFile> {
  const files: Array<RequestFile> = [];
  const uploadedNames = new Map<number, Set<string>>();
  for (let urlObj of Object.values(urls)) {
    const match = urlObj.url.matchAll(URL_FILE_REPLACEMENT_REGEX).next().value;
    if (!match) {
      continue;
    }
    const fileKey = parseInt(match[1]) - 1;
    const file = tag.files[fileKey];
    if (!file) {
      throw new Error(tag.translate('tagscript.invalid_file_provied'));
    }
    if (!file.buffer) {
      urlObj.url = file.url;
      continue;
    }

    const filename = urlObj.filename || file.filename;
    const names = uploadedNames.get(fileKey) || new Set<string>();
    uploadedNames.set(fileKey, names);
    if (!names.has(filename)) {
      names.add(filename);
      files.push({filename, value: file.buffer});
    }
    if (!match[2]) {
      file.deleted = true;
    }
    urlObj.url = '';
  }
  return files;
}


const PLAIN_DECIMAL_REGEX = /^([+-]?)(\d*)(?:\.(\d*))?$/;

// turns a number into a canonical plain decimal string (no exponent, no leading/trailing zeros) so huge integers and
// decimals compare exactly, or null if it isn't a number. empty strings are 0 like they were with BigInt('')
export function toPlainDecimal(value: string): string | null {
  let text = value.trim();
  if (!PLAIN_DECIMAL_REGEX.test(text) || text === '.' || /^[+-]\.?$/.test(text)) {
    const number = Number(text);
    if (!text || !Number.isFinite(number)) {
      return (text) ? null : '0';
    }
    if (Number.isInteger(number) && 1e21 <= Math.abs(number)) {
      text = BigInt(number).toString();
    } else {
      text = (String(number).includes('e')) ? number.toFixed(20) : String(number);
    }
  }
  const [ , sign, integer, fraction ] = text.match(PLAIN_DECIMAL_REGEX)!;
  const integerPart = integer.replace(/^0+/, '') || '0';
  const fractionPart = (fraction || '').replace(/0+$/, '');
  const isZero = integerPart === '0' && !fractionPart;
  return ((sign === '-' && !isZero) ? '-' : '') + integerPart + ((fractionPart) ? `.${fractionPart}` : '');
}

// compares two strings from `toPlainDecimal`
export function compareDecimals(x: string, y: string): number {
  const xNegative = x.startsWith('-'), yNegative = y.startsWith('-');
  if (xNegative !== yNegative) {
    return (xNegative) ? -1 : 1;
  }
  const direction = (xNegative) ? -1 : 1;
  const [ xInteger, xFraction = '' ] = x.replace('-', '').split('.');
  const [ yInteger, yFraction = '' ] = y.replace('-', '').split('.');
  if (xInteger.length !== yInteger.length) {
    return (xInteger.length < yInteger.length) ? -direction : direction;
  }
  const length = Math.max(xFraction.length, yFraction.length);
  const xDigits = xInteger + xFraction.padEnd(length, '0');
  const yDigits = yInteger + yFraction.padEnd(length, '0');
  if (xDigits === yDigits) {
    return 0;
  }
  return (xDigits < yDigits) ? -direction : direction;
}


// storage values are strings, objects/arrays from code get stored as json instead of `[object Object]`
function stringifyStorageValue(value: any): string {
  if (typeof(value) === 'string') {
    return value;
  }
  if (value && typeof(value) === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}


// the api does not store empty values, so they do not count towards the storage amount limits
function countStorageValues(values: Record<string, any>): number {
  return Object.values(values).filter((value) => stringifyStorageValue(value)).length;
}


// the tagscript being ran was written by NotSoAI (not a user's tag)
// `PrivateVariables.IS_FROM_AI` is set by the NotSoAI command when it parses the AI's response, and by {ai} when it parses its response outside of a tag
// users cannot set private variables, and {tag} clears it for the tag it calls
export function isFromAI(context: Command.Context | Interaction.InteractionContext, tag: TagResult): boolean {
  if (context.metadata && context.metadata.tag) {
    return false;
  }
  return !!tag.variables[PrivateVariables.IS_FROM_AI];
}


// attaches a file api response (like {api.utilities.screenshot}) to the tag's output
function addFileResponseToTag(
  context: Command.Context | Interaction.InteractionContext,
  tag: TagResult,
  response: RestResponsesRaw.FileResponse,
): void {
  if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
    throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
  }

  const data = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
  if (context.maxAttachmentSize < data.length) {
    throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: context.maxAttachmentSize}));
  }
  assertTotalFileSize(context, tag, data.length);
  tag.variables[PrivateVariables.FILE_SIZE] += data.length;

  tag.files.push({
    buffer: data,
    filename: response.file.filename_safe,
    spoiler: false,
    url: '',
  });
}


// accepts an IANA name (`america/new_york`), the enum name (`AMERICA_NEW_YORK`), or an abbreviation/city from the display text (`EST`, `alaska`)
function resolveTimezone(value: string): string | null {
  const insensitive = value.toLowerCase().replace(/\s+/g, '_');
  for (let key in Timezones) {
    const timezone = (Timezones as any)[key] as string;
    if (timezone.toLowerCase() === insensitive || key.toLowerCase() === insensitive) {
      return timezone;
    }
  }

  const upper = value.toUpperCase();
  const lower = value.toLowerCase();
  for (let timezone in TimezonesToText) {
    const text = (TimezonesToText as any)[timezone] as string;
    if (text && text.includes(`(${upper})`)) {
      return timezone;
    }
  }
  if (lower.length < 3) {
    return null;
  }
  for (let timezone in TimezonesToText) {
    const text = (TimezonesToText as any)[timezone] as string;
    if (text && text.toLowerCase().includes(lower)) {
      return timezone;
    }
  }
  return null;
}


// strips the user object out since the AI only ever sees the command user's reminders
function serializeReminderForTag(reminder: RestResponsesRaw.Reminder) {
  return {
    channel_id: reminder.channel_id,
    content: reminder.content,
    guild_id: reminder.guild_id,
    id: reminder.id,
    is_all_day: reminder.is_all_day,
    position: reminder.position,
    timestamp_end: reminder.timestamp_end,
    timestamp_start: reminder.timestamp_start,
  };
}


// fallback settings accept the function's names (`search.google.images`) or the enum names (`SEARCH_GOOGLE_IMAGES`)
// `choices` maps the function to store to the functions/names that select it
function parseFallbackSetting(value: string, choices: Record<string, Array<string>>): string | null {
  const insensitive = value.toLowerCase();
  const upper = value.toUpperCase();
  for (let tagFunction in choices) {
    for (let choice of choices[tagFunction]) {
      if (choice === upper) {
        return tagFunction;
      }
      if (choice in TagFunctionsToString && (TagFunctionsToString as any)[choice].includes(insensitive)) {
        return tagFunction;
      }
    }
  }
  return null;
}


// accepts the style names (`RELATIVE`, case insensitive) and discord's letters (`R`, case sensitive)
export function parseMarkupTimestampStyle(value: string): MarkupTimestampStyles | undefined {
  value = value.trim();
  if ((Object.values(MarkupTimestampStyles) as Array<string>).includes(value)) {
    return value as MarkupTimestampStyles;
  }
  const insensitive = value.toUpperCase();
  if (insensitive in MarkupTimestampStyles) {
    return (MarkupTimestampStyles as any)[insensitive] as MarkupTimestampStyles;
  }
  return undefined;
}


// not every node version has `crypto.randomUUIDv7()`
export function randomUUIDv7(): string {
  if (typeof((crypto as any).randomUUIDv7) === 'function') {
    return (crypto as any).randomUUIDv7();
  }

  // 48 bit unix timestamp in milliseconds, then version 7, then variant 10, the rest is random
  const bytes = crypto.randomBytes(16);
  let timestamp = Date.now();
  for (let i = 5; 0 <= i; i--) {
    bytes[i] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}


export function increaseAIExecutions(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.AI_EXECUTIONS] += amount;
  }
  if (tag.limits.MAX_AI_EXECUTIONS < tag.variables[PrivateVariables.AI_EXECUTIONS]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_ai', {max: tag.limits.MAX_AI_EXECUTIONS.toLocaleString()}));
  }
}


export function increaseAPIManipulations(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.API_MANIPULATIONS] += amount;
  }
  if (tag.limits.MAX_API_MANIPULATIONS < tag.variables[PrivateVariables.API_MANIPULATIONS]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_api', {max: tag.limits.MAX_API_MANIPULATIONS.toLocaleString()}));
  }
}


export function increaseComponentExecutions(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.COMPONENT_EXECUTIONS] += amount;
  }
  if (tag.limits.MAX_COMPONENT_EXECUTIONS < tag.variables[PrivateVariables.COMPONENT_EXECUTIONS]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_component', {max: tag.limits.MAX_COMPONENT_EXECUTIONS.toLocaleString()}));
  }
}


export function increaseNetworkRequests(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.NETWORK_REQUESTS] += amount;
  }
  if (tag.limits.MAX_NETWORK_REQUESTS < tag.variables[PrivateVariables.NETWORK_REQUESTS]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_network', {max: tag.limits.MAX_NETWORK_REQUESTS.toLocaleString()}));
  }
}


export function increaseNetworkRequestsML(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.NETWORK_REQUESTS_ML] += amount;
  }
  if (tag.limits.MAX_NETWORK_REQUESTS_ML < tag.variables[PrivateVariables.NETWORK_REQUESTS_ML]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_machine', {max: tag.limits.MAX_NETWORK_REQUESTS_ML.toLocaleString()}));
  }
}


export function increaseNetworkRequestsSafety(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.NETWORK_REQUESTS_SAFETY] += amount;
  }
  if (tag.limits.MAX_NETWORK_REQUESTS_SAFETY < tag.variables[PrivateVariables.NETWORK_REQUESTS_SAFETY]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_safety', {max: tag.limits.MAX_NETWORK_REQUESTS_SAFETY.toLocaleString()}));
  }
}


// {math} and {replace} each have their own timeout, but nothing stopped a tag from running hundreds of them
export async function withSyncTimeBudget<T>(
  context: Command.Context | Interaction.InteractionContext,
  tag: TagResult,
  func: () => Promise<T> | T,
): Promise<T> {
  const max = tag.limits.MAX_SYNC_TIME;
  if (max <= (tag.variables as any)[PrivateVariables.SYNC_TIME]) {
    throw new Error(getCachedTranslator(context).translateMaybe(
      'tagscript.tag_used_too_much_processing_time',
      `Tag spent too long in {math}/{replace} (max ${max.toLocaleString()}ms)`,
    ));
  }
  const started = Date.now();
  try {
    return await func();
  } finally {
    (tag.variables as any)[PrivateVariables.SYNC_TIME] += Date.now() - started;
  }
}


export function increaseTagExecutions(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.TAG_EXECUTIONS] += amount;
  }
  if (tag.limits.MAX_TAG_EXECUTIONS < tag.variables[PrivateVariables.TAG_EXECUTIONS]) {
    throw new Error(tag.translate('tagscript.tag_attempted_to_use_too_many_tag', {max: tag.limits.MAX_TAG_EXECUTIONS.toLocaleString()}));
  }
}


// discord allows 40 components in a components v2 message (`MAX_COMPONENTS_V2` in the paginator)
// the page buttons (an action row with 5 buttons) and the page's content take 7 of them
// (not imported from the paginator, the paginator imports this file through the formatters)
export const MAX_PAGE_COMPONENTS = 40 - 7;

const PAGE_COMPONENT_TYPES_TOP_LEVEL = [
  MessageComponentTypes.ACTION_ROW,
  MessageComponentTypes.CONTAINER,
  MessageComponentTypes.FILE,
  MessageComponentTypes.MEDIA_GALLERY,
  MessageComponentTypes.SECTION,
  MessageComponentTypes.SEPARATOR,
  MessageComponentTypes.TEXT_DISPLAY,
];

// components v2 layouts for a page, the paginator owns the buttons so only link buttons are allowed
export function parsePageComponents(data: unknown, tag: TagResult): Array<Record<string, any>> | undefined {
  if (!Array.isArray(data) || !data.length) {
    return undefined;
  }

  let amount = 0;
  const check = (component: Record<string, any>): void => {
    amount++;
    switch (component.type) {
      case MessageComponentTypes.BUTTON: {
        if (!component.url) {
          throw new Error(tag.translate('tagscript.page_components_must_not_be_interactive'));
        }
      }; break;
      case MessageComponentTypes.SELECT_MENU: {
        throw new Error(tag.translate('tagscript.page_components_must_not_be_interactive'));
      };
    }
    if (Array.isArray(component.components)) {
      for (let child of component.components) {
        check(child);
      }
    }
    if (component.accessory && typeof(component.accessory) === 'object') {
      check(component.accessory);
    }
  };

  const components: Array<Record<string, any>> = [];
  for (let x of data) {
    if (!x || typeof(x) !== 'object') {
      throw new Error(tag.translate('tagscript.invalid_page_given'));
    }
    const component = parseComponentFromData(x, undefined, undefined, tag.translate);
    if (!PAGE_COMPONENT_TYPES_TOP_LEVEL.includes(component.type)) {
      if (component.type === MessageComponentTypes.BUTTON) {
        throw new Error(tag.translate('tagscript.components.buttons_must_only_be_in_action_rows_or'));
      }
      throw new Error(tag.translate('tagscript.page_components_must_not_be_interactive'));
    }
    check(component);
    components.push(component);
  }
  if (MAX_PAGE_COMPONENTS < amount) {
    throw new Error(tag.translate('tagscript.page_components_surpassed_max_of', {max: MAX_PAGE_COMPONENTS}));
  }
  return components;
}


export function checkTagComponentsLimit(components: TagResultComponents | null, translate: Translator['translate']) {
  if (components && components.components.length) {
    let actionRows: number = 0;
    let buttons: number = 0;
    for (let component of components.components) {
      switch (component.type) {
        case MessageComponentTypes.ACTION_ROW: {
          actionRows++;
          if (buttons) {
            throw new Error(translate('tagscript.only_support_actionrows_or_buttons_not_both'));
          }
          /*
          for (let x of component.components) {
            if (25 <= buttons) {
              throw new Error(translate('tagscript.tagscript_only_supports_up_to_25_buttons'));
            }
            switch (x.type) {
              case MessageComponentTypes.BUTTON: buttons++; break;
            }
          }
          */
        }; break;
        case MessageComponentTypes.BUTTON: {
          buttons++;
          if (actionRows) {
            throw new Error(translate('tagscript.only_support_actionrows_or_buttons_not_both'));
          }
        }; break;
      }
      if (5 < actionRows) {
        throw new Error(translate('tagscript.tagscript_only_supports_up_to_5_action'));
      }
      if (25 < buttons) {
        throw new Error(translate('tagscript.tagscript_only_supports_up_to_25_buttons'));
      }
    }
  }
}


export function resetTagLimits(tag: TagResult) {
  const variables = tag.variables;
  (variables as any)[PrivateVariables.ITERATIONS_REMAINING] = tag.limits.MAX_ITERATIONS;
  (variables as any)[PrivateVariables.AI_EXECUTIONS] = 0;
  (variables as any)[PrivateVariables.API_MANIPULATIONS] = 0;
  (variables as any)[PrivateVariables.COMPONENT_EXECUTIONS] = 0;
  (variables as any)[PrivateVariables.NETWORK_REQUESTS] = 0;
  (variables as any)[PrivateVariables.NETWORK_REQUESTS_ML] = 0;
  (variables as any)[PrivateVariables.NETWORK_REQUESTS_SAFETY] = 0;
  (variables as any)[PrivateVariables.FILE_SIZE] = 0;
  (variables as any)[PrivateVariables.TAG_EXECUTIONS] = 0;
  Object.assign(tag.variables, {
    [PrivateVariables.RESULTS]: Object.assign({}, tag.variables[PrivateVariables.RESULTS], {
      [TagFunctions.ATTACHMENT]: undefined,
    }),
  });
  tag.files = [];
}


export function split(value: string, amount: number = 0): Array<string> {
  if (!value.includes(TagSymbols.SPLITTER_ARGUMENT)) {
    return [value];
  }

  let depth = 0;
  let position = 0;
  let text = '';

  const args: Array<string> = [];
  while (position < value.length) {
    // the last argument (when there's a limit) is always the raw rest of the value, escapes and all. functions like
    // {if}/{foreach} parse it again as code. it used to be unescaped when nothing came after it and raw otherwise, so
    // `{set:x|a\|b}` and `{set:x|a\|b|c}` stored `a\|b` differently
    if (amount && args.length === amount - 1 && !text) {
      args.push(value.slice(position));
      position = value.length;
      break;
    }
    if (amount && amount <= args.length) {
      if (args.length) {
        args[args.length - 1] += value.slice(position - 1);
      }
      break;
    }

    if (depth === 0 && !text) {
      // find next left bracket
      const nextLeftBracket = value.indexOf(TagSymbols.BRACKET_LEFT, position);
      if (nextLeftBracket === -1) {
        const remaining = value.slice(position);
        const parts = remaining.split(REGEX_ARGUMENT_SPLITTER);
        if (amount && parts.length > amount - args.length) {
          const headCount = amount - args.length - 1;
          let consumed = 0;
          for (let i = 0; i < headCount; i++) {
            args.push(parts[i].replace(REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT, TagSymbols.SPLITTER_ARGUMENT));
            consumed += parts[i].length + TagSymbols.SPLITTER_ARGUMENT.length;
          }
          args.push(remaining.slice(consumed)); // raw tail, splitters preserved
        } else {
          for (let i = 0; i < parts.length; i++) {
            if (amount && args.length === amount - 1) {
              // the last argument stays raw, see above
              args.push(parts.slice(i).join(TagSymbols.SPLITTER_ARGUMENT));
              break;
            }
            args.push(parts[i].replace(REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT, TagSymbols.SPLITTER_ARGUMENT));
          }
        }
        position = value.length;
        continue;
      }
    }

    let result = value.slice(position, ++position);
    text += result;
    switch (result) {
      case TagSymbols.SPLITTER_ARGUMENT: {
        if (depth <= 0) {
          // use the arg, we arent in the function anymore
          args.push(text.slice(0, -1));
          text = '';
        }
      }; break;
      case TagSymbols.IGNORE: {
        const nextValue = value.slice(position, position + 1);
        if (nextValue === TagSymbols.BRACKET_LEFT) {
          depth--;
        } else if (nextValue === TagSymbols.BRACKET_RIGHT) {
          depth++;
        } else if (nextValue === TagSymbols.SPLITTER_ARGUMENT) {
          if (depth <= 0) {
            // `\|` is a literal `|`, same as the regex path above
            text = text.slice(0, -1) + TagSymbols.SPLITTER_ARGUMENT;
          } else {
            // inside a nested function keep the escape, that function splits its own arguments
            // (unescaping here turned `{choose:{choose:a\|b}|c}` into `{choose:a|b}`)
            text += TagSymbols.SPLITTER_ARGUMENT;
          }
          position++;
        }
      }; break;
      case TagSymbols.BRACKET_LEFT: {
        // start of the script
        depth++;
      }; break;
      case TagSymbols.BRACKET_RIGHT: {
        // end of the script
        depth--;
      }; break;
    }
  }

  if (text) {
    args.push(text);
  }
  return args;
}


function parseInnerScript(value: string, shouldTrim: boolean = true): [string, string] {
  let scriptName: string;
  let arg: string;

  // remove the brackets from both sides of the value
  value = value.slice(1, value.length - 1);
  if (shouldTrim) {
    value = value.trim();
  }

  const firstSplitter = value.indexOf(TagSymbols.SPLITTER_FUNCTION);
  if (firstSplitter === -1) {
    scriptName = value;
    arg = '';
  } else {
    scriptName = value.slice(0, firstSplitter);
    arg = value.slice(firstSplitter + 1);
  }

  return [scriptName.toLowerCase(), arg];
}


async function parseValue(
  context: Command.Context | Interaction.InteractionContext,
  tag: TagResult,
  value: string,
): Promise<string> {
  if (value.includes(TagSymbols.BRACKET_LEFT)) {
    const argParsed = await parse(context, value, '', tag.variables, tag.context, tag.limits, tag.files);
    normalizeTagResults(tag, argParsed, false);
    return argParsed.text;
  }
  return value.trim();
}


function normalizeTagResults(main: TagResult, other: TagResult, content: boolean = true): void {
  if (content) {
    // the main tag's own parse loop also checks this, but a child result can be appended many times before that runs
    if (main.limits.MAX_TEXT_LENGTH < main.text.length + other.text.length) {
      throw new Error(main.translate('tagscript.text_exceeded_bytes', {max: main.limits.MAX_TEXT_LENGTH}));
    }
    main.text += other.text;
  }

  if (other.components) {
    if (main.components) {
      main.components.components = [...main.components.components, ...other.components.components];
      checkTagComponentsLimit(main.components, main.translate);
      if (other.components.onTimeout) {
        main.components.onTimeout = other.components.onTimeout;
      }
    } else {
      main.components = other.components;
    }
  }

  if (main.limits.MAX_EMBEDS < main.embeds.length + other.embeds.length) {
    throw new Error(main.translate('tagscript.embeds_surpassed_max_embeds_length_of', {max: main.limits.MAX_EMBEDS}));
  }
  for (let embed of other.embeds) {
    main.embeds.push(embed);
  }

  // todo: must be a better way than this
  if (other.files !== main.files) {
    for (let file of other.files) {
      if (!main.files.includes(file)) {
        main.files.push(file);
      }
    }
  }

  if (main.limits.MAX_ATTACHMENTS < main.files.length) {
    throw new Error(main.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: main.limits.MAX_ATTACHMENTS}));
  }

  if (main.limits.MAX_PAGES < main.pages.length + other.pages.length) {
    throw new Error(main.translate('tagscript.pages_surpassed_max_page_length_of', {max: main.limits.MAX_PAGES}));
  }
  for (let page of other.pages) {
    main.pages.push(page);
  }
}


const ScriptTags = Object.freeze({
  _code: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult, language: CodeLanguages, version?: string | null): Promise<boolean> => {
    // {python:code}

    arg = arg.trim();
    if (arg.startsWith('```') && arg.endsWith('```')) {
      const { language, text } = Parameters.codeblock(arg);
      arg = text;
    }

    if (!arg) {
      return true;
    }

    increaseNetworkRequests(tag);

    const blobs: {
      channel: string | null,
      global: string | null,
      server: string | null,
      user: string | null,
    } = {channel: null, global: null, server: null, user: null};

    const storage: {
      channel: Record<string, string>,
      global: Record<string, string>,
      server: Record<string, string>,
      user: Record<string, string>,
    } = {channel: {}, global: {}, server: {}, user: {}};

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      {
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        const response = await fetchTagBlobs(context, tagId, {
          channelId: context.channelId!,
          guildId: context.guildId,
          userId: context.userId,
        });
        for (let key of Object.keys(response)) {
          const storageType = parseInt(key) as TagBlobStorageTypes;
          switch (storageType) {
            case TagBlobStorageTypes.CHANNEL: {
              blobs.channel = response[storageType];
            }; break;
            case TagBlobStorageTypes.GUILD: {
              blobs.server = response[storageType];
            }; break;
            case TagBlobStorageTypes.USER: {
              blobs.user = response[storageType];
            }; break;
            case TagBlobStorageTypes.GLOBAL: {
              blobs.global = response[storageType];
            }; break;
          }
        }
      }
      {
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        const response = await fetchTagVariables(context, tagId, {
          channelId: context.channelId!,
          guildId: context.guildId,
          userId: context.userId,
        });
        for (let key of Object.keys(response)) {
          const storageType = parseInt(key) as TagVariableStorageTypes;
          switch (storageType) {
            case TagVariableStorageTypes.CHANNEL: {
              Object.assign(storage.channel, response[storageType]);
            }; break;
            case TagVariableStorageTypes.GUILD: {
              Object.assign(storage.server, response[storageType]);
            }; break;
            case TagVariableStorageTypes.USER: {
              Object.assign(storage.user, response[storageType]);
            }; break;
            case TagVariableStorageTypes.GLOBAL: {
              Object.assign(storage.global, response[storageType]);
            }; break;
          }
        }
      }
    }

    const variables = Object.assign({
      [PrivateVariables.FILES]: tag.files.map((file) => {
        return {description: file.description, filename: file.filename};
      }),
    }, tag.variables, {
      [PrivateVariables.RESULTS]: Object.assign({}, tag.variables[PrivateVariables.RESULTS], {
        [TagFunctions.ATTACHMENT]: undefined,
      }),
    });
    const { code, urls } = generateCodeFromLanguage(language, arg);
    if (!code) {
      return true;
    }

    const files = collectCodeFiles(tag, urls);

    // backwards since splicing shifts the later files down
    for (let i = tag.files.length - 1; 0 <= i; i--) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    const { result } = await utilitiesCodeRun(context, {
      code,
      files,
      language,
      safe: DefaultParameters.safe(context),
      stdin: generateCodeStdin(context, variables, storage, blobs),
      urls: Object.values(urls).filter((x) => x.url),
      version: version || undefined,
    });

    if (result.error) {
      // if it starts with ffmpeg error, check if its only 1 or less files to throw error
      if (result.error.startsWith(CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND) || result.error.includes('Input')) {
        if (result.files.every((x) => x.filename === '__internals__.json')) {
          throw new Error(result.error);
        }
      } else {
        throw new Error(result.error);
      }
    }

    if (result.files.length) {
      const maxFileSize = context.maxAttachmentSize;
      for (let file of result.files) {
        const { filename, size, value } = file;
        // oversized output files used to be skipped here without a word, the error further down was unreachable.
        // only the internal state file is still skipped when it's too big
        if (maxFileSize < size && filename === '__internals__.json') {
          continue;
        }
        if (filename === '__internals__.json') {
          let response: any = {};
          try {
            response = JSON.parse(Buffer.from(value, 'base64').toString());
          } catch(error) {

          }

          if (typeof(response) === 'object') {
            if (typeof(response.variables) === 'object') {
              const variables = response.variables;
              for (let key in variables) {
                if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
                  continue;
                }

                if (tag.limits.MAX_VARIABLE_KEY_LENGTH < key.length) {
                  throw new Error(tag.translate('tagscript.variable_cannot_be_more_than_characters', {max: tag.limits.MAX_VARIABLE_KEY_LENGTH}));
                }

                if (!(key in tag.variables)) {
                  if (tag.limits.MAX_VARIABLES <= Object.keys(tag.variables).filter((key) => !key.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
                    throw new Error(tag.translate('tagscript.reached_max_variable_amount_max_variables', {max: tag.limits.MAX_VARIABLES.toLocaleString()}));
                  }
                }

                tag.variables[key] = String((variables as any)[key]).slice(0, tag.limits.MAX_VARIABLE_LENGTH);
              }
            }

            if (response.blobs && typeof(response.blobs) === 'object') {
              const variables = response.blobs;
              const formattedBlobs: Array<{storageId: string, storageType: TagBlobStorageTypes, value: string}> = [];
              if (variables.global === undefined) {
                // set the default blob
                if (blobs.global) {
                  formattedBlobs.push({
                    storageId: '0',
                    storageType: TagBlobStorageTypes.GLOBAL,
                    value: blobs.global,
                  });
                }
              } else if (variables.global === null) {
                // clear the blob
              } else {
                if (variables.global && typeof(variables.global) === 'object') {
                  // objects get stored as their json, base64 encoded like the string values
                  variables.global = Buffer.from(JSON.stringify(variables.global)).toString('base64');
                }
                if (!variables.global || typeof(variables.global) === 'string') {
                  // assume its base64 already
                  let value: Buffer | null = null;
                  if (variables.global) {
                    try {
                      value = Buffer.from(variables.global, 'base64');
                    } catch(error) {
                      throw new Error(tag.translate('tagscript.global_blob_value_must_be_base64_encoded'));
                    }
                  }
                  if (value) {
                    if (tag.limits.MAX_BLOB_VALUE_LENGTH < value.length) {
                      throw new Error(tag.translate('tagscript.global_blob_value_cannot_be_more_than', {max: tag.limits.MAX_BLOB_VALUE_LENGTH}));
                    }
                    formattedBlobs.push({
                      storageId: '0',
                      storageType: TagBlobStorageTypes.GLOBAL,
                      value: variables.global,
                    });
                  }
                } else {
                  throw new Error(tag.translate('tagscript.global_blob_value_must_be_base64_encoded'));
                }
              }

              if (variables.server === undefined) {
                // set the default blob
                if (blobs.server) {
                  formattedBlobs.push({
                    storageId: context.guildId || context.channelId!,
                    storageType: TagBlobStorageTypes.GUILD,
                    value: blobs.server,
                  });
                }
              } else if (variables.server === null) {
                // clear the blob
              } else {
                if (variables.server && typeof(variables.server) === 'object') {
                  // objects get stored as their json, base64 encoded like the string values
                  variables.server = Buffer.from(JSON.stringify(variables.server)).toString('base64');
                }
                if (!variables.server || typeof(variables.server) === 'string') {
                  // assume its base64 already
                  let value: Buffer | null = null;
                  if (variables.server) {
                    try {
                      value = Buffer.from(variables.server, 'base64');
                    } catch(error) {
                      throw new Error(tag.translate('tagscript.server_blob_value_must_be_base64_encoded'));
                    }
                  }
                  if (value) {
                    if (tag.limits.MAX_BLOB_VALUE_LENGTH < value.length) {
                      throw new Error(tag.translate('tagscript.server_blob_value_cannot_be_more_than', {max: tag.limits.MAX_BLOB_VALUE_LENGTH}));
                    }
                    formattedBlobs.push({
                      storageId: context.guildId || context.channelId!,
                      storageType: TagBlobStorageTypes.GUILD,
                      value: variables.server,
                    });
                  }
                } else {
                  throw new Error(tag.translate('tagscript.server_blob_value_must_be_base64_encoded'));
                }
              }

              if (variables.channel === undefined) {
                // set the default blob
                if (blobs.channel) {
                  formattedBlobs.push({
                    storageId: context.channelId!,
                    storageType: TagBlobStorageTypes.CHANNEL,
                    value: blobs.channel,
                  });
                }
              } else if (variables.channel === null) {
                // clear the blob
              } else {
                if (variables.channel && typeof(variables.channel) === 'object') {
                  // objects get stored as their json, base64 encoded like the string values
                  variables.channel = Buffer.from(JSON.stringify(variables.channel)).toString('base64');
                }
                if (!variables.channel || typeof(variables.channel) === 'string') {
                  // assume its base64 already
                  let value: Buffer | null = null;
                  if (variables.channel) {
                    try {
                      value = Buffer.from(variables.channel, 'base64');
                    } catch(error) {
                      throw new Error(tag.translate('tagscript.channel_blob_value_must_be_base64_encoded'));
                    }
                  }
                  if (value) {
                    if (tag.limits.MAX_BLOB_VALUE_LENGTH < value.length) {
                      throw new Error(tag.translate('tagscript.channel_blob_value_cannot_be_more_than', {max: tag.limits.MAX_BLOB_VALUE_LENGTH}));
                    }
                    formattedBlobs.push({
                      storageId: context.channelId!,
                      storageType: TagBlobStorageTypes.CHANNEL,
                      value: variables.channel,
                    });
                  }
                } else {
                  throw new Error(tag.translate('tagscript.channel_blob_value_must_be_base64_encoded'));
                }
              }

              if (variables.user === undefined) {
                // set the default blob
                if (blobs.user) {
                  formattedBlobs.push({
                    storageId: context.userId,
                    storageType: TagBlobStorageTypes.USER,
                    value: blobs.user,
                  });
                }
              } else if (variables.user === null) {
                // clear the blob
              } else {
                if (variables.user && typeof(variables.user) === 'object') {
                  // objects get stored as their json, base64 encoded like the string values
                  variables.user = Buffer.from(JSON.stringify(variables.user)).toString('base64');
                }
                if (!variables.user || typeof(variables.user) === 'string') {
                  // assume its base64 already
                  let value: Buffer | null = null;
                  if (variables.user) {
                    try {
                      value = Buffer.from(variables.user, 'base64');
                    } catch(error) {
                      throw new Error(tag.translate('tagscript.user_blob_value_must_be_base64_encoded'));
                    }
                  }
                  if (value) {
                    if (tag.limits.MAX_BLOB_VALUE_LENGTH < value.length) {
                      throw new Error(tag.translate('tagscript.user_blob_value_cannot_be_more_than', {max: tag.limits.MAX_BLOB_VALUE_LENGTH}));
                    }
                    formattedBlobs.push({
                      storageId: context.userId,
                      storageType: TagBlobStorageTypes.USER,
                      value: variables.user,
                    });
                  }
                } else {
                  throw new Error(tag.translate('tagscript.user_blob_value_must_be_base64_encoded'));
                }
              }

              let hasChange = false;
              if (variables.global !== undefined) {
                hasChange = blobs.global != variables.global;
              }
              if (!hasChange && variables.server !== undefined) {
                hasChange = blobs.server != variables.server;
              }
              if (!hasChange && variables.channel !== undefined) {
                hasChange = blobs.channel != variables.channel;
              }
              if (!hasChange && variables.user !== undefined) {
                hasChange = blobs.user != variables.user;
              }

              if (hasChange && tagId) {
                // tag storage goes through our api, so it counts like any other request
                increaseNetworkRequests(tag);
                const blobsResponse = await putTagBlobs(context, tagId, {
                  blobs: formattedBlobs,
                  channelId: context.channelId!,
                  guildId: context.guildId,
                  userId: context.userId,
                });
                // store it in tagresult i guess
              }
            }

            if (response.storage && typeof(response.storage) === 'object') {
              const variables = response.storage;
              const formattedVariables: Array<{name: string, storageId: string, storageType: TagVariableStorageTypes, value: string}> = [];
              if (variables.global === undefined) {
                // set the default variables
                for (let key in storage.global) {
                  formattedVariables.push({
                    name: String(key),
                    storageId: '0',
                    storageType: TagVariableStorageTypes.GLOBAL,
                    value: storage.global[key],
                  });
                }
              } else if (variables.global === null) {
                // clear the variables
              } else if (typeof(variables.global) === 'object') {
                if (tag.limits.MAX_STORAGE_GLOBAL_AMOUNT < countStorageValues(variables.global)) {
                  throw new Error(tag.translate('tagscript.global_variables_exceeded_max_amount', {max: tag.limits.MAX_STORAGE_GLOBAL_AMOUNT}));
                }
                for (let key in variables.global) {
                  if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_key_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
                  }
                  const value = stringifyStorageValue(variables.global[key]);
                  if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
                  }
                  formattedVariables.push({
                    name: String(key),
                    storageId: '0',
                    storageType: TagVariableStorageTypes.GLOBAL,
                    value,
                  });
                }
              } else {
                throw new Error(tag.translate('tagscript.global_variables_must_be_an_object_or'));
              }

              if (variables.server === undefined) {
                // set the default variables
                for (let key in storage.server) {
                  formattedVariables.push({
                    name: String(key),
                    storageId: context.guildId || context.channelId!,
                    storageType: TagVariableStorageTypes.GUILD,
                    value: storage.server[key],
                  });
                }
              } else if (variables.server === null) {
                // clear the variables
              } else if (typeof(variables.server) === 'object') {
                if (tag.limits.MAX_STORAGE_GUILD_AMOUNT < countStorageValues(variables.server)) {
                  throw new Error(tag.translate('tagscript.server_variables_exceeded_max_amount', {max: tag.limits.MAX_STORAGE_GUILD_AMOUNT}));
                }
                for (let key in variables.server) {
                  if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_key_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
                  }
                  const value = stringifyStorageValue(variables.server[key]);
                  if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
                  }
                  formattedVariables.push({
                    name: String(key),
                    storageId: context.guildId || context.channelId!,
                    storageType: TagVariableStorageTypes.GUILD,
                    value,
                  });
                }
              } else {
                throw new Error(tag.translate('tagscript.server_variables_must_be_an_object_or'));
              }

              if (variables.channel === undefined) {
                // set the default variables
                for (let key in storage.channel) {
                  formattedVariables.push({
                    name: String(key),
                    storageId: context.channelId!,
                    storageType: TagVariableStorageTypes.CHANNEL,
                    value: storage.channel[key],
                  });
                }
              } else if (variables.channel === null) {
                // clear the variables
              } else if (typeof(variables.channel) === 'object') {
                if (tag.limits.MAX_STORAGE_CHANNEL_AMOUNT < countStorageValues(variables.channel)) {
                  throw new Error(tag.translate('tagscript.channel_variables_exceeded_max_amount', {max: tag.limits.MAX_STORAGE_CHANNEL_AMOUNT}));
                }
                for (let key in variables.channel) {
                  if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_key_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
                  }
                  const value = stringifyStorageValue(variables.channel[key]);
                  if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
                  }
                  formattedVariables.push({
                    name: String(key),
                    storageId: context.channelId!,
                    storageType: TagVariableStorageTypes.CHANNEL,
                    value,
                  });
                }
              } else {
                throw new Error(tag.translate('tagscript.channel_variables_must_be_an_object_or'));
              }

              if (variables.user === undefined) {
                // set the default variables
                for (let key in storage.user) {
                  formattedVariables.push({
                    name: String(key),
                    storageId: context.userId,
                    storageType: TagVariableStorageTypes.USER,
                    value: storage.user[key],
                  });
                }
              } else if (variables.user === null) {
                // clear the variables
              } else if (typeof(variables.user) === 'object') {
                if (tag.limits.MAX_STORAGE_USER_AMOUNT < countStorageValues(variables.user)) {
                  throw new Error(tag.translate('tagscript.user_variables_exceeded_max_amount', {max: tag.limits.MAX_STORAGE_USER_AMOUNT}));
                }
                for (let key in variables.user) {
                  if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_key_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
                  }
                  const value = stringifyStorageValue(variables.user[key]);
                  if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                    throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
                  }
                  formattedVariables.push({
                    name: String(key),
                    storageId: context.userId,
                    storageType: TagVariableStorageTypes.USER,
                    value,
                  });
                }
              } else {
                throw new Error(tag.translate('tagscript.user_variables_must_be_an_object_or'));
              }

              let hasChange = false;
              if (variables.global !== undefined) {
                if (variables.global) {
                  hasChange = Object.keys(variables.global).length !== Object.keys(storage.global).length;
                } else {
                  hasChange = !!Object.keys(storage.global).length;
                }
              }
              if (!hasChange && variables.server !== undefined) {
                if (variables.server) {
                  hasChange = Object.keys(variables.server).length !== Object.keys(storage.server).length;
                } else {
                  hasChange = !!Object.keys(storage.server).length;
                }
              }
              if (!hasChange && variables.channel !== undefined) {
                if (variables.channel) {
                  hasChange = Object.keys(variables.channel).length !== Object.keys(storage.channel).length;
                } else {
                  hasChange = !!Object.keys(storage.channel).length;
                }
              }
              if (!hasChange && variables.user !== undefined) {
                if (variables.user) {
                  hasChange = Object.keys(variables.user).length !== Object.keys(storage.user).length;
                } else {
                  hasChange = !!Object.keys(storage.user).length;
                }
              }

              if (!hasChange) {
                for (let item of formattedVariables) {
                  switch (item.storageType) {
                    case TagVariableStorageTypes.CHANNEL: {
                      if (storage.channel && !(item.name in storage.channel) || storage.channel[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                    case TagVariableStorageTypes.GLOBAL: {
                      if (storage.global && !(item.name in storage.global) || storage.global[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                    case TagVariableStorageTypes.GUILD: {
                      if (storage.server && !(item.name in storage.server) || storage.server[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                    case TagVariableStorageTypes.USER: {
                      if (storage.user && !(item.name in storage.user) || storage.user[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                  }
                  if (hasChange) {
                    break;
                  }
                }
              }

              if (hasChange && tagId) {
                // tag storage goes through our api, so it counts like any other request
                increaseNetworkRequests(tag);
                const storageResponse = await putTagVariables(context, tagId, {
                  channelId: context.channelId!,
                  guildId: context.guildId,
                  userId: context.userId,
                  variables: formattedVariables,
                });
                // store it in tagresult i guess
              }
            }
          }
          continue;
        }

        if (maxFileSize < size) {
          throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
        }

        assertTotalFileSize(context, tag, size);
        tag.variables[PrivateVariables.FILE_SIZE] += size;

        tag.files.push({
          buffer: Buffer.from(value, 'base64'),
          filename,
          url: '',
        });

        if (tag.limits.MAX_ATTACHMENTS < tag.files.length) {
          throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
        }
      }
    }

    let isComponents = false;
    let isEmbed = false;
    // only check for json in smaller outputs, bigger outputs are always text
    if (result.output.length <= 16000) {
      // just incase its a big content lol
      let object: any = null;
      try {
        object = JSON.parse(result.output);
      } catch(error) {
        
      }
      
      if (object && typeof(object) === 'object') {
        const keysLength = Object.keys(object).length;
        if (keysLength === 1 && 'pages' in object && Array.isArray(object.pages)) {
          // parse them
          // [{embed}]
          for (let page of object.pages) {
            let components: Array<Record<string, any>> | undefined;
            let content: string | undefined;
            let embeds: Array<Embed> | undefined;
            let filenames: Array<string> | undefined;
            if (typeof(page) !== 'object') {
              throw new Error(tag.translate('tagscript.invalid_page_given'));
            }
            if ('content' in page && typeof(page.content) === 'string') {
              content = page.content;
            }
            if ('embed' in page && typeof(page.embed) === 'object') {
              try {
                const embed = new Embed(page.embed);
                if (!embed.size && (!embed.image || !embed.image.url) && (!embed.thumbnail || !embed.thumbnail.url) && (!embed.video || !embed.video.url)) {
                  throw new Error('this error doesn\'t matter');
                }
                embeds = [embed];
              } catch(error) {
                throw new Error(tag.translate('tagscript.invalid_page_given'));
              }
            }
            if ('files' in page && Array.isArray(page.files)) {
              for (let filename of page.files) {
                if (filename && typeof(filename) === 'string' && filename.startsWith('attachment://')) {
                  if (!filenames) {
                    filenames = [];
                  }
                  filenames.push(filename);
                }
              }
            }
            if ('components' in page) {
              components = parsePageComponents(page.components, tag);
            }
            if (!content && !embeds && !filenames && !components) {
              throw new Error(tag.translate('tagscript.invalid_page_given'));
            }
            tag.pages.push({components, content, embeds, filenames});
            if (tag.limits.MAX_PAGES < tag.pages.length) {
              throw new Error(tag.translate('tagscript.pages_surpassed_max_pages_length_of', {max: tag.limits.MAX_PAGES}));
            }
          }
        }
        if ('components' in object && Array.isArray(object.components)) {
          const components: TagResultComponents = {components: []};
          for (let x of object.components) {
            if (typeof(x) !== 'object') {
              continue;
            }
            const component = parseComponentFromData(x, undefined, undefined, tag.translate);
            components.components.push(component);
            checkTagComponentsLimit(components, tag.translate);
          }
          if ('componentsOnTimeout' in object && typeof(object.componentsOnTimeout) === 'string') {
            components.onTimeout = object.componentsOnTimeout;
          }
          if (components.components.length) {
            tag.components = components;
            isComponents = true;
          }
        }
        if (('embed' in object) || ('embeds' in object)) {
          const embeds: Array<Record<string, any>> = [];
          if ('embed' in object && typeof(object.embed) === 'object') {
            embeds.push(object.embed);
          }
          if ('embeds' in object && Array.isArray(object.embeds)) {
            for (let embed of object.embeds) {
              if (typeof(embed) === 'object') {
                embeds.push(embed);
              }
            }
          }

          if (tag.limits.MAX_EMBEDS < embeds.length) {
            throw new Error(tag.translate('tagscript.embeds_surpassed_max_embeds_length_of', {max: tag.limits.MAX_EMBEDS}));
          }

          isEmbed = true;
          for (let raw of embeds) {
            // todo: maybe add embed length checks here?
            try {
              const embed = new Embed(raw);
              if (!embed.size && (!embed.image || !embed.image.url) && (!embed.thumbnail || !embed.thumbnail.url) && (!embed.video || !embed.video.url)) {
                throw new Error('this error doesn\'t matter');
              }
              tag.embeds.push(embed);
            } catch(error) {
              throw new Error(tag.translate('tagscript.invalid_embed_given'));
            }
          }

          if (tag.limits.MAX_EMBEDS < tag.embeds.length) {
            throw new Error(tag.translate('tagscript.embeds_surpassed_max_embeds_length_of', {max: tag.limits.MAX_EMBEDS}));
          }
        }
      }
    }

    if (!isComponents && !isEmbed) {
      tag.text += result.output;
    }

    return true;
  },

  [TagFunctions.AI]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {ai:question}

    arg = arg.trim();
    if (arg.startsWith('```') && arg.endsWith('```')) {
      const { language, text } = Parameters.codeblock(arg);
      arg = text;
    }

    if (!arg) {
      return true;
    }

    const { code: prompt, urls } = generateCodeFromLanguage(null, arg);
    if (!prompt) {
      return true;
    }

    const files = collectCodeFiles(tag, urls);

    // backwards since splicing shifts the later files down
    for (let i = tag.files.length - 1; 0 <= i; i--) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseAIExecutions(tag);
    increaseNetworkRequests(tag);

    let personality: string | null | undefined;
    if (tag.variables[PrivateVariables.SETTINGS][TagSettings.AI_PERSONALITY]) {
      personality = tag.variables[PrivateVariables.SETTINGS][TagSettings.AI_PERSONALITY];
    } else {
      const personalities = await getAIPersonality(context, arg);
      personality = personalities[0];
    }

    const response = await generateTag(context, {
      files,
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.AI_MODEL],
      personality,
      prompt: [
        `${PrivateVariables.AI_EXECUTIONS} count: ${tag.variables[PrivateVariables.AI_EXECUTIONS]}`,
        prompt,
      ].join('\n').slice(0, 12000),
      urls: Object.values(urls).filter((x) => x.url),
    });

    tag.variables[PrivateVariables.RESULTS][TagFunctions.AI] = response;

    if (context.metadata && context.metadata.tag) {
      // is from a tag
      tag.text += response.text;
    } else {
      // is from ai, parse the text first
      const isFromAICache = tag.variables[PrivateVariables.IS_FROM_AI];
      tag.variables[PrivateVariables.IS_FROM_AI] = 1;
      try {
        tag.text += await parseValue(context, tag, response.text);
      } finally {
        tag.variables[PrivateVariables.IS_FROM_AI] = isFromAICache;
      }
    }

    return true;
  },

  [TagFunctions.API_CREATE_REMINDER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.create.reminder:time} {api.create.reminder:time|text}
    // only NotSoAI can use this

    if (!isFromAI(context, tag)) {
      return false;
    }

    if (!arg) {
      return true;
    }

    let [ timeText, text ] = split(arg, 2);
    if (!timeText) {
      return true;
    }

    const result = Parameters.nlpTimestamp(timeText, context);
    if (!text) {
      text = result.content;
    }

    increaseAPIManipulations(tag);
    increaseNetworkRequests(tag);

    // todo: add a tag id to this
    const reminder = await createReminder(context, {
      channelId: context.channelId,
      content: (text || '').slice(0, 512),
      guildId: context.guildId,
      messageId: (context instanceof Command.Context) ? context.messageId : null,
      timestampEnd: (result.end) ? result.end.getTime() : undefined,
      timestampStart: result.start.getTime(),
    });

    if (context.manager) {
      await context.manager.broadcastEval(ReminderInterval.broadcastEvalInsert, reminder);
    } else if (context.cluster) {
      ReminderInterval.insertReminder(context.cluster, reminder);
    }

    tag.text += JSON.stringify(serializeReminderForTag(reminder));

    return true;
  },

  [TagFunctions.API_DELETE_REMINDER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.delete.reminder:position}
    // only NotSoAI can use this, deletes one of the command user's reminders by its position (from {api.fetch.reminders})

    if (!isFromAI(context, tag)) {
      return false;
    }

    arg = arg.trim();
    if (!arg) {
      return true;
    }

    const position = parseInt(arg);
    if (isNaN(position) || position < 1) {
      throw new Error('Reminder position must be a positive number');
    }

    increaseAPIManipulations(tag);
    increaseNetworkRequests(tag);

    try {
      await deleteReminderPositional(context, context.userId, position);
    } catch(error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Unknown reminder at position ${position}`);
      }
      throw error;
    }

    tag.text += 'true';

    return true;
  },

  [TagFunctions.API_EDIT_REMINDER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.edit.reminder:position|time} {api.edit.reminder:position|time|text} {api.edit.reminder:position||text}
    // only NotSoAI can use this, an empty time keeps the current time, no text keeps the current text

    if (!isFromAI(context, tag)) {
      return false;
    }

    if (!arg) {
      return true;
    }

    const [ positionText, timeText, text ] = split(arg, 3);
    const position = parseInt((positionText || '').trim());
    if (isNaN(position) || position < 1) {
      throw new Error('Reminder position must be a positive number');
    }

    const options: RestOptions.EditReminder = {};
    if (timeText && timeText.trim()) {
      const result = Parameters.nlpTimestamp(timeText, context);
      options.timestampStart = result.start.getTime();
      options.timestampEnd = (result.end) ? result.end.getTime() : null;
    }
    if (text !== undefined) {
      options.content = text.slice(0, 512);
    }
    if (!('timestampStart' in options) && !('content' in options)) {
      return true;
    }

    increaseAPIManipulations(tag);
    increaseNetworkRequests(tag, 2);

    let reminder: RestResponsesRaw.Reminder;
    try {
      reminder = await fetchReminderPositional(context, context.userId, position);
    } catch(error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Unknown reminder at position ${position}`);
      }
      throw error;
    }

    // the api publishes the update so the reminder gets rescheduled
    const edited = await editReminder(context, reminder.id, options);
    tag.text += JSON.stringify(serializeReminderForTag(edited));

    return true;
  },

  [TagFunctions.API_FETCH_REMINDERS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.fetch.reminders} {api.fetch.reminders:global}
    // only NotSoAI can use this, lists the command user's reminders (for this server, or every server if `global`)

    if (!isFromAI(context, tag)) {
      return false;
    }

    const isGlobal = arg.trim().toLowerCase() === 'global';
    const guildId = (isGlobal) ? undefined : (context.guildId || 0);

    increaseNetworkRequests(tag);

    const response = await fetchUserReminders(context, context.userId, {guildId});
    tag.text += JSON.stringify({
      count: response.count,
      reminders: response.reminders.map(serializeReminderForTag),
    });

    return true;
  },

  [TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.search.duckduckgo.images:query}

    if (!arg) {
      return true;
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES] ||
      {}
    );

    arg = arg.slice(0, 1024);
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[arg] || await searchDuckDuckGoImages(context, {
      query: arg,
      safe: DefaultParameters.safe(context),
    });
    if (!(arg in cachedResults)) {
      cachedResults[arg] = response;
    }

    tag.text += JSON.stringify(response);
  
    return true;
  },

  [TagFunctions.API_SEARCH_IMGUR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.search.imgur:query}

    if (!arg) {
      return true;
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.API_SEARCH_IMGUR] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.API_SEARCH_IMGUR] ||
      {}
    );

    arg = arg.slice(0, 1024);
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[arg] || await searchImgur(context, {query: arg});
    if (!(arg in cachedResults)) {
      cachedResults[arg] = response;
    }

    tag.text += JSON.stringify(response);

    return true;
  },

  [TagFunctions.API_UTILITIES_LOCATIONS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.utilities.locations:query}

    if (!arg) {
      return true;
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.API_UTILITIES_LOCATIONS] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.API_UTILITIES_LOCATIONS] ||
      {}
    );

    arg = arg.slice(0, 1024);
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[arg] || await utilitiesLocations(context, {
      query: arg,
    });
    if (!(arg in cachedResults)) {
      cachedResults[arg] = response;
    }

    tag.text += JSON.stringify(response);
  
    return true;
  },

  [TagFunctions.API_UTILITIES_QR_CREATE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.utilities.qr.create:text}

    if (!arg) {
      return true;
    }

    increaseNetworkRequests(tag);

    const response = await utilitiesQrCreate(context, {query: arg.slice(0, 2048)});
    addFileResponseToTag(context, tag, response);

    return true;
  },

  [TagFunctions.API_UTILITIES_QR_SCAN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.utilities.qr.scan} {api.utilities.qr.scan:url}

    increaseNetworkRequests(tag);

    const url = await lastImageUrl(arg.trim(), context);
    if (!url) {
      throw new Error('Cannot find any images');
    }

    increaseNetworkRequests(tag);

    const response = await utilitiesQrScan(context, {url});
    tag.text += JSON.stringify({results: response.results});

    return true;
  },

  [TagFunctions.API_UTILITIES_SCREENSHOT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.utilities.screenshot:url}

    arg = arg.trim();
    if (!arg) {
      return true;
    }

    increaseNetworkRequests(tag);

    const response = await utilitiesScreenshot(context, {
      safe: DefaultParameters.safe(context),
      url: arg,
    });
    addFileResponseToTag(context, tag, response);

    return true;
  },

  [TagFunctions.API_UTILITIES_WEATHER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.utilities.weather:query|units?}
  
    if (!arg) {
      return true;
    }

    let units: MeasurementUnits | undefined;
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      const parts = split(arg);
      const insensitive = parts[parts.length - 1].toUpperCase();
      if (insensitive in MeasurementUnits) {
        units = insensitive as MeasurementUnits;
        parts.pop();
        arg = parts.join(TagSymbols.SPLITTER_ARGUMENT);
      }
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.API_UTILITIES_WEATHER] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.API_UTILITIES_WEATHER] ||
      {}
    );

    arg = arg.slice(0, 1024);
    // the units change the response, so cache per query and units
    const cacheKey = `${units || ''}:${arg}`;
    if (!(cacheKey in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[cacheKey] || await utilitiesWeather(context, {
      query: arg,
      units: units,
    });
    if (!(cacheKey in cachedResults)) {
      cachedResults[cacheKey] = response;
    }

    tag.text += JSON.stringify(response);

    return true;
  },

  [TagFunctions.ARG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {arg} (defaults to the first one)
    // {arg:0}

    let index = parseInt(arg || '0');
    if (isNaN(index)) {
      return false;
    }

    const args = tag.variables[PrivateVariables.ARGS];
    if (index < 0) {
      index = args.length + index;
    }

    if (index in args) {
      tag.text += args[index];
    }

    return true;
  },

  [TagFunctions.ARG_SAFE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {argsafe} (defaults to the first one)
    // {argsafe:0}
  
    let index = parseInt(arg || '0');
    if (isNaN(index)) {
      return false;
    }
  
    const args = tag.variables[PrivateVariables.ARGS];
    if (index < 0) {
      index = args.length + index;
    }

    if (index in args) {
      tag.text += args[index].replace(/(?<!\\)\|/g, '\\|');
    }

    return true;
  },

  [TagFunctions.ARGS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {args}
    // {args:INDEX|INDEX2} (slice which amount of args you want)

    if (arg) {
      const args = tag.variables[PrivateVariables.ARGS];

      let [ indexStartString, indexStopString ] = split(arg, 2);

      let index = parseInt(indexStartString || '0');
      if (isNaN(index)) {
        return false;
      }

      if (index < 0) {
        index = args.length + index;
      }

      let indexStop = parseInt(indexStopString || String(tag.variables[PrivateVariables.ARGS].length));
      // this checked `index` again, so `{args:0|x}` sliced with NaN and gave nothing
      if (isNaN(indexStop)) {
        return false;
      }

      if (indexStop < 0) {
        indexStop = args.length + indexStop;
      }

      tag.text += args.slice(index, indexStop).join(' ');
    } else {
      tag.text += tag.variables[PrivateVariables.ARGS_STRING]
    }

    return true;
  },

  [TagFunctions.ARGS_LEN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {argslen}

    tag.text += tag.variables[PrivateVariables.ARGS].length;
    return true;
  },

  [TagFunctions.ARGS_SAFE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {argssafe}
    // {argssafe:INDEX|INDEX2} (slice which amount of args you want)
  
    if (arg) {
      const args = tag.variables[PrivateVariables.ARGS];
  
      let [ indexStartString, indexStopString ] = split(arg, 2);
  
      let index = parseInt(indexStartString || '0');
      if (isNaN(index)) {
        return false;
      }
  
      if (index < 0) {
        index = args.length + index;
      }
  
      let indexStop = parseInt(indexStopString || String(tag.variables[PrivateVariables.ARGS].length));
      // this checked `index` again, so `{args:0|x}` sliced with NaN and gave nothing
      if (isNaN(indexStop)) {
        return false;
      }
  
      if (indexStop < 0) {
        indexStop = args.length + indexStop;
      }
  
      tag.text += args.slice(index, indexStop).join(' ').replace(/(?<!\\)\|/g, '\\|');
    } else {
      tag.text += tag.variables[PrivateVariables.ARGS_STRING].replace(/(?<!\\)\|/g, '\\|');
    }
  
    return true;
  },

  [TagFunctions.ATTACHMENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult, spoiler?: boolean): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attach:url|filename|description}
    // {attach:https://google.com/something.png}
    // {attach:https://google.com/something.png|something_lol.png}

    if (tag.limits.MAX_ATTACHMENTS === 0) {
      return false;
    }

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
    }

    let [ urlString, filenameArg, descriptionValue ] = split(arg, 3);

    const url = await Parameters.url(urlString.trim(), context);

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.ATTACHMENT] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.ATTACHMENT] ||
      {}
    );

    if (!(url in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    try {
      const maxFileSize = context.maxAttachmentSize;
      const response = cachedResults[url] || await utilitiesFetchMedia(context, {
        maxFileSize,
        safe: DefaultParameters.safe(context),
        url,
      }).then((x) => jobWaitForResponse(context, x));

      if (!(url in cachedResults)) {
        cachedResults[url] = response;
      }

      const filename = filenameArg || response.file.filename_safe;

      let data: Buffer | string = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
      if (response.file.metadata.mimetype.startsWith('text/')) {
        data = data.toString();
      }

      if (maxFileSize < data.length) {
        throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
      }

      assertTotalFileSize(context, tag, data.length);
      tag.variables[PrivateVariables.FILE_SIZE] += data.length;

      tag.files.push({
        buffer: data,
        description: descriptionValue,
        filename,
        spoiler,
        url,
      });
    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.ATTACHMENT_LAST]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // return last image url
    // {lastattachment}

    increaseNetworkRequests(tag);

    const url = await lastImageUrl('', context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.ATTACHMENT_SPOILER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attachspoiler:https://google.com/something.png}
    return ScriptTags[TagFunctions.ATTACHMENT](context, arg, tag, true);
  },

  [TagFunctions.ATTACHMENT_TEXT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {attachtext:text}
    // {attachtext:some text here}

    if (tag.limits.MAX_ATTACHMENTS === 0) {
      return false;
    }

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
    }

    let extension = 'txt';
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      // parse the language in the future here
    }

    let filename = 'content';
    if (tag.files.length) {
      filename = `${filename}.${tag.files.length + 1}`;
    }

    const data = arg;
    try {
      const maxFileSize = context.maxAttachmentSize;
      if (maxFileSize < data.length) {
        throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
      }

      assertTotalFileSize(context, tag, data.length);
      tag.variables[PrivateVariables.FILE_SIZE] += data.length;

      tag.files.push({buffer: data, filename: `${filename}.${extension}`, spoiler: false, url: ''});
    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.ATTACHMENT_VOICE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attach:url|filename}
    // {attach:https://google.com/something.mp3}
    // {attach:https://google.com/something.mp3|voice-message}

    if (tag.limits.MAX_ATTACHMENTS === 0) {
      return false;
    }

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
    }

    let [ urlString, filenameArg ] = split(arg, 2);

    const url = await Parameters.url(urlString.trim(), context);

    increaseNetworkRequests(tag);
    try {
      const maxFileSize = context.maxAttachmentSize;
      const response = await mediaAVToolsExtractAudio(context, {
        maxFileSize,
        mimetype: Mimetypes.AUDIO_OGG,
        url,
        waveform: true,
      });
      const filename = filenameArg || response.file.filename_safe;
      const waveform = response.arguments && response.arguments.waveform;

      const data: Buffer = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
      if (maxFileSize < data.length) {
        throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
      }

      assertTotalFileSize(context, tag, data.length);
      tag.variables[PrivateVariables.FILE_SIZE] += data.length;

      tag.files.push({
        buffer: data,
        durationSecs: 2147483647, //response.file.metadata.duration / 1000,
        filename,
        spoiler: false,
        waveform,
        url,
      });
    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.AVATAR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns the user's avatar url
    // {avatar}
    // {avatar:notsobot}
    // {avatar:notsobot#1}
    // {avatar:439205512425504771}

    if (arg) {
      increaseNetworkRequests(tag);
      const memberOrUser = await findMemberOrUser(arg, context);
      if (memberOrUser) {
        tag.text += memberOrUser.avatarUrlFormat({size: 1024});
      }
    } else {
      const memberOrUser = context.member || context.user;
      tag.text += memberOrUser.avatarUrlFormat({size: 1024});
    }
    return true;
  },

  [TagFunctions.CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns the channel's name
    // {channel}
    // {channel:general}
    // {channel:560595518129045504}

    if (arg) {
      const channel = await findChannel(arg, context);
      if (channel) {
        tag.text += channel.name;
      }
    } else {
      tag.text += (context.channel && context.guildId) ? context.channel.name : 'Direct Message';
    }

    return true;
  },

  [TagFunctions.CHANNEL_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns the channel's id
    // {channelid}
    // {channelid:general}
    // {channelid:560595518129045504}

    if (arg) {
      const channel = await findChannel(arg, context);
      if (channel) {
        tag.text += channel.id;
      }
    } else {
      tag.text += context.channelId;
    }
    return true;
  },

  [TagFunctions.CHANNEL_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns the channel's mention
    // {channelmention}
    // {channelmention:general}
    // {channelmention:560595518129045504}

    if (arg) {
      const channel = await findChannel(arg, context);
      if (channel) {
        tag.text += channel.mention;
      }
    } else {
      tag.text += `<#${context.channelId}>`;
    }
    return true;
  },

  [TagFunctions.CHANNEL_RANDOM]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a random channel's name
    // {randchannel}

    if (context.guild) {
      const channel = randomFromIterator<Structures.Channel>(context.guild.channels.length, context.guild.channels.values());
      tag.text += (channel) ? channel.name : '';
    } else {
      tag.text += 'Direct Message';
    }
    return true;
  },

  [TagFunctions.COMPONENT_JSON]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {componentjson:COMPONENT_JSON}

    arg = arg.trim();
    if (arg.startsWith('```') && arg.endsWith('```')) {
      const { language, text } = Parameters.codeblock(arg);
      arg = text;
    }

    // restore the previous value (it can already be set from an outer {componentjson}/code block), even on errors
    const wasChildParsing = tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING];
    tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING] = 1;
    let text: string;
    try {
      text = await parseValue(context, tag, arg);
    } finally {
      tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING] = wasChildParsing;
    }

    let data : any = null;
    if (text) {
      try {
        // {newline} inside of json strings becomes an actual newline
        data = JSON.parse(text.replace(REGEX_NEWLINE_SENTINEL, '\\n'));
      } catch(error) {
        throw new Error(tag.translate('tagscript.invalid_component_given'));
      }
    }

    if (!data || typeof(data) !== 'object') {
      throw new Error(tag.translate('tagscript.invalid_component_given'));
    }

    const components: TagResultComponents = tag.components || {components: []};

    const component = parseComponentFromData(data, undefined, undefined, tag.translate);
    components.components.push(component);
    checkTagComponentsLimit(components, tag.translate);

    if (components.components.length) {
      tag.components = components;
    }

    return true;
  },

  [TagFunctions.COMPONENTS_ON_TIMEOUT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // execute this tagscript code on component expire
    // {componentsontimeout:TAGSCRIPT}

    arg = arg.trim();
    if (!arg) {
      return false;
    }

    if (!tag.components) {
      tag.components = {components: []};
    }
    tag.components.onTimeout = arg;

    return true;
  },

  [TagFunctions.CHANNEL_RANDOM_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // return a random channel's id
    // {randchannelid}

    if (context.guild) {
      const channel = randomFromIterator<Structures.Channel>(context.guild.channels.length, context.guild.channels.values());
      tag.text += (channel) ? channel.id : context.channelId;
    } else {
      tag.text += context.channelId;
    }
    return true;
  },

  [TagFunctions.CHANNEL_RANDOM_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // return a random channel's mention
    // {randchannelmention}

    if (context.guild) {
      const channel = randomFromIterator<Structures.Channel>(context.guild.channels.length, context.guild.channels.values());
      tag.text += (channel) ? channel.mention : `<#${context.channelId}>`;
    } else {
      tag.text += `<#${context.channelId}>`;
    }
    return true;
  },

  [TagFunctions.DISCORD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // split it up by `.`, use the first one as context[firstVariable]

    // {discord:member.color}
    // {discord:user.id}
    return false;
  },

  [TagFunctions.EMBED_JSON]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {embedjson:{"title": "asd"}}

    try {
      // {newline} inside of json strings becomes an actual newline
      let object = JSON.parse(arg.replace(REGEX_NEWLINE_SENTINEL, '\\n'));
      if (typeof(object) !== 'object') {
        throw new Error(tag.translate('tagscript.invalid_embed_given'));
      }

      const embed = new Embed(object);
      if (
        !embed.size &&
        (!embed.image || !embed.image.url) &&
        (!embed.thumbnail || !embed.thumbnail.url) &&
        (!embed.video || !embed.video.url)
      ) {
        throw new Error('this error doesn\'t matter');
      }
      tag.embeds.push(embed);
    } catch(error) {
      return false;
    }

    if (tag.limits.MAX_EMBEDS < tag.embeds.length) {
      throw new Error(tag.translate('tagscript.embeds_surpassed_max_embeds_length_of', {max: tag.limits.MAX_EMBEDS}));
    }

    return true;
  },

  [TagFunctions.EVAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {eval:{args}}

    tag.text += await parseValue(context, tag, arg);

    return true;
  },

  [TagFunctions.EVAL_SILENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {evalsilent:{args}}

    try {
      tag.text += await parseValue(context, tag, arg);
    } catch(error) {
      if (error instanceof TagExitError) {
        throw error;
      }
    }

    return true;
  },

  [TagFunctions.EXIT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {exit:text?}

    throw new TagExitError(arg);

    return true;
  },

  [TagFunctions.EXIT_SILENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {exitsilent}

    throw new TagExitError(arg, true);

    return true;
  },

  [TagFunctions.GUILD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {guild}
    // todo: {guild:178313653177548800}

    if (context.guild) {
      tag.text += context.guild.name;
    } else {
      tag.text += 'Direct Message';
    }
    return true;
  },

  [TagFunctions.GUILD_COUNT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {guildcount}
    // todo: {guildcount:178313653177548800}

    if (context.guild) {
      tag.text += context.guild.memberCount;
    } else {
      tag.text += '2';
    }
    return true;
  },

  [TagFunctions.GUILD_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {guildid}
    // todo: {guildid:178313653177548800} (useless lmao)

    tag.text += (context.guildId) ? context.guildId : '0';
    return true;
  },

  [TagFunctions.HASTEBIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {hastebin:data}

    return false;
  },

  [TagFunctions.IMAGE_INTERROGATE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // interrogate an image
    // {interrogate:cake}

    increaseNetworkRequests(tag);

    let url = await lastImageUrl(arg.trim(), context);
    if (!url) {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_IV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        const textCache = tag.text;
    
        tag.text = '';
        await ScriptTags[fallbackFunction](context, arg, tag);
        url = tag.text;
        tag.text = textCache;
      }
    }

    if (url) {
      try {
        const response = await utilitiesMLInterrogate(context, {url});
        tag.text += response.prompt;
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.IMAGE_OCR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // ocr an image
    // {ocr:cake}

    increaseNetworkRequests(tag);

    let url = await lastImageUrl(arg.trim(), context);
    if (!url) {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_IV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        const textCache = tag.text;
    
        tag.text = '';
        await ScriptTags[fallbackFunction](context, arg, tag);
        url = tag.text;
        tag.text = textCache;
      }
    }

    if (url) {
      try {
        const { annotation } = await googleContentVisionOCR(context, {url});
        if (annotation) {
          tag.text += annotation.description;
        }
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.INSERT_BRACKET_LEFT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {bracketleft}
    // {bracketleft:5}

    if (arg) {
      const amount = parseInt(arg);
      if (isNaN(amount)) {
        return false;
      }
      if (amount <= 0 || tag.limits.MAX_VARIABLE_LENGTH < amount) {
        throw new Error(tag.translate('tagscript.cannot_repeat_character_less_than_0_or', {max: tag.limits.MAX_VARIABLE_LENGTH}));
      }
      tag.text += TagSymbols.BRACKET_LEFT.repeat(amount);
    } else {
      tag.text += TagSymbols.BRACKET_LEFT;
    }

    return true;
  },

  [TagFunctions.INSERT_BRACKET_RIGHT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {bracketright}
    // {bracketright:5}
  
    if (arg) {
      const amount = parseInt(arg);
      if (isNaN(amount)) {
        return false;
      }
      if (amount <= 0 || tag.limits.MAX_VARIABLE_LENGTH < amount) {
        throw new Error(tag.translate('tagscript.cannot_repeat_character_less_than_0_or', {max: tag.limits.MAX_VARIABLE_LENGTH}));
      }
      tag.text += TagSymbols.BRACKET_RIGHT.repeat(amount);
    } else {
      tag.text += TagSymbols.BRACKET_RIGHT;
    }
  
    return true;
  },

  [TagFunctions.INSERT_NEWLINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {newline}
    // {newline:5} (5 newlines)

    if (arg) {
      const amount = parseInt(arg);
      if (isNaN(amount)) {
        return false;
      }
      if (amount <= 0 || tag.limits.MAX_VARIABLE_LENGTH < amount) {
        throw new Error(tag.translate('tagscript.cannot_repeat_character_less_than_0_or', {max: tag.limits.MAX_VARIABLE_LENGTH}));
      }
      tag.text += NEWLINE_SENTINEL.repeat(amount);
    } else {
      tag.text += NEWLINE_SENTINEL;
    }

    return true;
  },

  [TagFunctions.INSERT_SPLITTER_ARGUMENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {splitterargument}
    // {splitterargument:5}

    if (arg) {
      const amount = parseInt(arg);
      if (isNaN(amount)) {
        return false;
      }
      if (amount <= 0 || tag.limits.MAX_VARIABLE_LENGTH < amount) {
        throw new Error(tag.translate('tagscript.cannot_repeat_character_less_than_0_or', {max: tag.limits.MAX_VARIABLE_LENGTH}));
      }
      tag.text += TagSymbols.SPLITTER_ARGUMENT.repeat(amount);
    } else {
      tag.text += TagSymbols.SPLITTER_ARGUMENT;
    }

    return true;
  },

  [TagFunctions.INSERT_SPLITTER_FUNCTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {splitterfunction}
    // {splitterfunction:5}

    if (arg) {
      const amount = parseInt(arg);
      if (isNaN(amount)) {
        return false;
      }
      if (amount <= 0 || tag.limits.MAX_VARIABLE_LENGTH < amount) {
        throw new Error(tag.translate('tagscript.cannot_repeat_character_less_than_0_or', {max: tag.limits.MAX_VARIABLE_LENGTH}));
      }
      tag.text += TagSymbols.SPLITTER_FUNCTION.repeat(amount);
    } else {
      tag.text += TagSymbols.SPLITTER_FUNCTION;
    }

    return true;
  },

  [TagFunctions.JSON_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a json object of the channel
    // {json.channel}
    // {json.channel:general}
    // {json.channel:560595518129045504}
  
    if (arg) {
      const channel = await findChannel(arg, context);
      if (channel) {
        tag.text += JSON.stringify(channel);
      }
    } else if (context.channel) {
      tag.text += JSON.stringify(context.channel);
    } else if (context.channelId) {
      increaseNetworkRequests(tag);
      try {
        const channel = await context.rest.fetchChannel(context.channelId);
        tag.text += JSON.stringify(channel);
      } catch(error) {
        
      }
    }
  
    return true;
  },

  [TagFunctions.JSON_GUILD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a json object of the current guild
    // {json.guild}

    const guild = getGuildObjectForJSONSerialization(context);
    if (guild) {
      tag.text += JSON.stringify(guild);
    }

    return true;
  },

  [TagFunctions.JSON_MEMBER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a json object of the member
    // {json.member}
    // {json.member:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const memberOrUser = await findMemberOrUser(arg, context);
      if (memberOrUser && memberOrUser instanceof Structures.Member) {
        tag.text += JSON.stringify(memberOrUser.toJSON(true));
      }
    } else {
      const memberOrUser = context.member;
      if (memberOrUser && memberOrUser instanceof Structures.Member) {
        tag.text += JSON.stringify(memberOrUser.toJSON(true));
      }
    }

    return true;
  },

  [TagFunctions.JSON_MEMBER_OR_USER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a json object of the member or user
    // {json.memberoruser}
    // {json.memberoruser:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const memberOrUser = await findMemberOrUser(arg, context);
      if (memberOrUser) {
        if (memberOrUser instanceof Structures.Member) {
          tag.text += JSON.stringify(memberOrUser.toJSON(true));
        } else {
          tag.text += JSON.stringify(memberOrUser);
        }
      }
    } else {
      const memberOrUser = context.member || context.user;
      if (memberOrUser instanceof Structures.Member) {
        tag.text += JSON.stringify(memberOrUser.toJSON(true));
      } else {
        tag.text += JSON.stringify(memberOrUser);
      }
    }

    return true;
  },

  [TagFunctions.JSON_MESSAGE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a json object of the message
    // {json.message:MESSAGE_ID?}

    if (arg) {
      const channel = context.channel;
      if (channel) {
        const member = context.member;
        if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
          throw new Error(tag.translate('tagscript.you_cannot_view_the_history_of_this'));
        }
        if (!channel.canReadHistory) {
          throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
        }
      } else if (!context.inDm && !context.hasServerPermissions) {
        throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
      }

      const messageId = arg.trim();
      if (context.messages.has(messageId)) {
        const message = context.messages.get(messageId)!;
        if (message.channelId === context.channelId) {
          tag.text += JSON.stringify(message);
        }
      } else {
        increaseNetworkRequests(tag);
        try {
          const message = await context.rest.fetchMessage(context.channelId!, messageId);
          tag.text += JSON.stringify(message);
        } catch(error) {
    
        }
      }
    } else if (context instanceof Command.Context) {
      tag.text += JSON.stringify(context.message);
    }

    return true;
  },

  [TagFunctions.JSON_MESSAGE_REPLY]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {json.messagereply}

    if (context instanceof Command.Context && context.message && context.message.referencedMessage) {
      tag.text += JSON.stringify(context.message.referencedMessage);
    }

    return true;
  },

  [TagFunctions.JSON_USER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns a json object of the user
    // {json.user}
    // {json.user:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const memberOrUser = await findMemberOrUser(arg, context);
      if (memberOrUser) {
        if (memberOrUser instanceof Structures.Member) {
          tag.text += JSON.stringify(memberOrUser.user);
        } else {
          tag.text += JSON.stringify(memberOrUser);
        }
      }
    } else {
      tag.text += JSON.stringify(context.user);
    }

    return true;
  },

  [TagFunctions.LOGICAL_AND]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {and:action|action}, unlimited actions

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    const conditionals = split(arg);
    for (let i = 0; i < conditionals.length; i++) {
      const conditional = conditionals[i];

      const text = await parseValue(context, tag, conditional);
      if (!text) {
        break;
      }

      if (i === conditionals.length - 1) {
        tag.text += text;
      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_FOR_EACH]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {foreach:jsonarray|code}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ text, code ] = split(arg, 2);
    if (!text || !code) {
      return true;
    }

    let values: Array<[string, any]>;

    text = await parseValue(context, tag, text);
    if (isNaN(parseInt(text))) {
      try {
        let object = JSON.parse(text);
        if (typeof(object) === 'string') {
          object = Parameters.stringArguments(object);
        }
        if (typeof(object) === 'object') {
          if (Array.isArray(object)) {
            values = object.map((x, i) => {
              return [String(i), x];
            });
          } else {
            values = Object.keys(object).map((x) => {
              return [String(x), object[x]];
            });
          }
        } else {
          return true;
        }
      } catch(error) {
        return true;
      }
    } else {
      const count = parseInt(text);
      if (200 < count) {
        throw new Error(tag.translate('tagscript.cannot_have_a_for_loop_that_is'));
      }
      values = Array.from({length: count}).map((x, i) => {
        return [String(i), i];
      });
    }

    if (!values.length) {
      return true;
    }

    if (200 < values.length) {
      throw new Error(tag.translate('tagscript.cannot_have_a_for_loop_that_is'));
    }

    const idx = tag.variables[PrivateVariables.ID_X];
    const valuex = tag.variables[PrivateVariables.VALUE_X];
    // restored even when the loop body errors (like inside {iferror}), the outer loop's values used to be lost
    try {
      for (let [key, value] of values) {
        let text: string = '';
        if (code.includes(TagSymbols.BRACKET_LEFT)) {
          tag.variables[PrivateVariables.ID_X] = String(key);
          tag.variables[PrivateVariables.VALUE_X] = (typeof(value) === 'object') ? JSON.stringify(value) : String(value);
          text = await parseValue(context, tag, code);
        } else {
          text = code;
        }
        appendTagText(context, tag, text);
      }
    } finally {
      if (idx === undefined) {
        delete tag.variables[PrivateVariables.ID_X];
      } else {
        tag.variables[PrivateVariables.ID_X] = idx;
      }
      if (valuex === undefined) {
        delete tag.variables[PrivateVariables.VALUE_X];
      } else {
        tag.variables[PrivateVariables.VALUE_X] = valuex;
      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_DELETE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    arg = arg.trim();
    if (arg.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(tag.translate('tagscript.tried_to_delete_a_private_variable_cannot', {prefix: PRIVATE_VARIABLE_PREFIX}));
    }
    if (tag.limits.MAX_VARIABLE_KEY_LENGTH < arg.length) {
      throw new Error(tag.translate('tagscript.variable_cannot_be_more_than_characters', {max: tag.limits.MAX_VARIABLE_KEY_LENGTH}));
    }
    delete tag.variables[arg];

    return true;
  },

  [TagFunctions.LOGICAL_DELETE_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    arg = arg.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < arg.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.channelId!;
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        await deleteTagVariable(context, tagId, TagVariableStorageTypes.CHANNEL, storageId, {
          name: arg,
        });
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_DELETE_SERVER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    arg = arg.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < arg.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.guildId || context.channelId!;
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        await deleteTagVariable(context, tagId, TagVariableStorageTypes.GUILD, storageId, {
          name: arg,
        });
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_DELETE_USER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    arg = arg.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < arg.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.userId;
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        await deleteTagVariable(context, tagId, TagVariableStorageTypes.USER, storageId, {
          name: arg,
        });
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_GET]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {get:variable-name}
    // {get:variable-name|DEFAULT VALUE HERE}

    let [ key, defaultValue ] = split(arg, 2);
    if (key === undefined) {
      return false;
    }

    key = (await parseValue(context, tag, key)).trim();
    if (tag.limits.MAX_VARIABLE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.variable_cannot_be_more_than_characters', {max: tag.limits.MAX_VARIABLE_KEY_LENGTH}));
    }

    if (key === PrivateVariables.FILES) {
      const files = tag.files.map((file) => {
        return {description: file.description, filename: file.filename};
      });
      tag.text += JSON.stringify(files);
    } else if (key in tag.variables) {
      let value = tag.variables[key];
      if (typeof(value) === 'object') {
        value = JSON.stringify(value);
      }
      tag.text += value;
    } else if (defaultValue) {
      tag.text += await parseValue(context, tag, defaultValue);
    }

    return true;
  },

  [TagFunctions.LOGICAL_GET_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {getchannel:variable-name}
    // {getchannel:variable-name|DEFAULT VALUE HERE}

    let [ key, defaultValue ] = split(arg, 2);
    if (key === undefined) {
      return false;
    }

    key = (await parseValue(context, tag, key)).trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      try {
        const storageId = context.channelId!;
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.CHANNEL, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            tag.text += await parseValue(context, tag, defaultValue);
          }
        } else {
          throw error;
        }
      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_GET_FILE_NAME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {getfilename:file_number}

    arg = arg.trim();
    if (!arg) {
      return false;
    }

    const fileId = parseInt(arg) - 1;
    if (isNaN(fileId)) {
      return false;
    }

    if (!(fileId in tag.files)) {
      throw new Error(tag.translate('tagscript.file_id_does_not_exist', {id: fileId + 1}));
    }

    const file = tag.files[fileId]!;
    tag.text += file.filename;

    return true;
  },

  [TagFunctions.LOGICAL_GET_GLOBAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {getglobal:variable-name}
    // {getglobal:variable-name|DEFAULT VALUE HERE}

    let [ key, defaultValue ] = split(arg, 2);
    if (key === undefined) {
      return false;
    }

    key = (await parseValue(context, tag, key)).trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      try {
        const storageId = '0';
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.GLOBAL, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            tag.text += await parseValue(context, tag, defaultValue);
          }
        } else {
          throw error;
        }
      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_GET_SERVER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {getchannel:variable-name}
    // {getchannel:variable-name|DEFAULT VALUE HERE}

    let [ key, defaultValue ] = split(arg, 2);
    if (key === undefined) {
      return false;
    }

    key = (await parseValue(context, tag, key)).trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.guildId || context.channelId!;
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.GUILD, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            tag.text += await parseValue(context, tag, defaultValue);
          }
        } else {
          throw error;
        }
      }
    }
  
    return true;
  },

  [TagFunctions.LOGICAL_GET_USER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {getuser:variable-name}
    // {getuser:variable-name|DEFAULT VALUE HERE}

    let [ key, defaultValue ] = split(arg, 2);
    if (key === undefined) {
      return false;
    }

    key = (await parseValue(context, tag, key)).trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.userId;
        // tag storage goes through our api, so it counts like any other request
        increaseNetworkRequests(tag);
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.USER, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            tag.text += await parseValue(context, tag, defaultValue);
          }
        } else {
          throw error;
        }
      }
    }
  
    return true;
  },

  [TagFunctions.LOGICAL_INCLUDES]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {includes:text|value1|value2|value3|...}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    const values = split(arg);
    const text = await parseValue(context, tag, values[0]!);

    for (let i = 1; i < values.length; i++) {
      const value = values[i];

      const valueText = await parseValue(context, tag, value);
      if (text === valueText) {
        tag.text += String(true);
        return true;
      }
    }

    tag.text += String(false);

    return true;
  },

  [TagFunctions.LOGICAL_IF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {if:statement|comparison|value|then:action|else:action|finally:action}
    // {if:statement|comparison|value|else:action|then:action|finally:action}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ value1, comparison, value2, conditional1, conditional2, conditional3 ] = split(arg, 6);
    if (
      value1 === undefined ||
      comparison === undefined ||
      value2 === undefined ||
      (conditional1 === undefined && conditional2 === undefined && conditional3 === undefined)
    ) {
      return false;
    }

    let then = ''
    let elseValue = '';
    let finallyValue = '';
    for (let x of [conditional1, conditional2, conditional3]) {
      if (!x) {
        continue;
      }
      if (x.startsWith('then:')) {
        if (then) {
          throw new Error(tag.translate('tagscript.if_statement_must_have_only_one_then'));
        }
        then = x;
      } else if (x.startsWith('else:')) {
        if (elseValue) {
          throw new Error(tag.translate('tagscript.if_statement_must_have_only_one_else'));
        }
        elseValue = x;
      } else if (x.startsWith('finally:')) {
        if (finallyValue) {
          throw new Error(tag.translate('tagscript.if_statement_must_have_only_one_finally'));
        }
        finallyValue = x;
      } else {
        return false;
      }
    }

    if (!TAG_IF_COMPARISONS.includes(comparison as TagIfComparisons)) {
      return false;
    }

    const values: [string, string] = [value1, value2];
    for (let i in values) {
      values[i] = await parseValue(context, tag, values[i]);
    }

    let compared: boolean | undefined;
    switch (comparison) {
      case TagIfComparisons.EQUAL: {
        compared = values[0] === values[1];
      }; break;
      case TagIfComparisons.EQUAL_NOT: {
        compared = values[0] !== values[1];
      }; break;
      case TagIfComparisons.GREATER_THAN:
      case TagIfComparisons.GREATER_THAN_OR_EQUAL:
      case TagIfComparisons.LESS_THAN:
      case TagIfComparisons.LESS_THAN_OR_EQUAL:
      case TagIfComparisons.TILDE: {
        try {
          const [ [ int1, int2 ] ] = convertToBigIntFloats(...values);
          switch (comparison) {
            case TagIfComparisons.GREATER_THAN: {
              compared = int1 > int2;
            }; break;
            case TagIfComparisons.GREATER_THAN_OR_EQUAL: {
              compared = int1 >= int2;
            }; break;
            case TagIfComparisons.LESS_THAN: {
              compared = int1 < int2;
            }; break;
            case TagIfComparisons.LESS_THAN_OR_EQUAL: {
              compared = int1 <= int2;
            }; break;
            case TagIfComparisons.TILDE: {
              compared = ~int1 == ~int2;
            }; break;
          }
        } catch(error) {
          if (comparison === TagIfComparisons.TILDE) {
            compared = values[0].toLowerCase() === values[1].toLowerCase();
          } else {
            compared = false;
          }
        }
      }; break;
    }

    if (compared === undefined) {
      return false;
    }

    {
      const text = (compared) ? then.slice(5) : (elseValue || '').slice(5);
      tag.text += await parseValue(context, tag, text);
    }

    if (finallyValue) {
      tag.text += await parseValue(context, tag, finallyValue.slice(8));
    }

    return true;
  },

  [TagFunctions.LOGICAL_IF_ERROR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {iferror:action|action}, unlimited actions

    const conditionals = split(arg);
    for (let conditional of conditionals) {
      try {
        tag.text += await parseValue(context, tag, conditional);
      } catch(error) {
        if (error instanceof TagExitError) {
          throw error;
        }
        // go to the next one if it errors
        continue;
      }
      return true;
    }

    return true;
  },

  [TagFunctions.LOGICAL_IS_FROM_AI]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {isfromai}

    tag.text += String(isFromAI(context, tag));

    return true;
  },

  [TagFunctions.LOGICAL_IS_FROM_COMPONENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {isfromcomponent}

    if (tag.variables[PrivateVariables.COMPONENT_EXECUTIONS] <= 0) {
      tag.text += String(false);
    } else {
      tag.text += String(true);
    }

    return true;
  },

  [TagFunctions.LOGICAL_IS_MAIN_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {ismaintag}

    if (tag.variables[PrivateVariables.PARENT_TAG_ID]) {
      tag.text += String(false);
    } else {
      tag.text += String(true);
    }

    return true;
  },

  [TagFunctions.LOGICAL_OR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {or:action|action}, unlimited actions

    const conditionals = split(arg);
    for (let conditional of conditionals) {
      const text = await parseValue(context, tag, conditional);
      if (text) {
        tag.text += text;
        return true;
      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {set:variable|value}
    // {set:channel|123}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, value ] = split(arg, 2);

    key = await parseValue(context, tag, key);
    if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(tag.translate('tagscript.tried_to_set_a_private_variable_cannot', {prefix: PRIVATE_VARIABLE_PREFIX}));
    }

    if (tag.limits.MAX_VARIABLE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.variable_cannot_be_more_than_characters', {max: tag.limits.MAX_VARIABLE_KEY_LENGTH}));
    }

    if (!(key in tag.variables)) {
      if (tag.limits.MAX_VARIABLES <= Object.keys(tag.variables).filter((key) => !key.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
        throw new Error(tag.translate('tagscript.reached_max_variable_amount_max_variables', {max: tag.limits.MAX_VARIABLES.toLocaleString()}));
      }
    }

    value = await parseValue(context, tag, value);
    tag.variables[key] = value.slice(0, tag.limits.MAX_VARIABLE_LENGTH).trim();

    return true;
  },

  [TagFunctions.LOGICAL_SET_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setchannel:variable|value}
    // {setchannel:lastused|{userid}}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, value ] = split(arg, 2);

    key = await parseValue(context, tag, key);
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    const storageValue = await parseValue(context, tag, value);
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      const storageId = context.channelId!;
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await putTagVariable(context, tagId, TagVariableStorageTypes.CHANNEL, storageId, {
        name: key,
        value: storageValue,
      });
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET_FILE_NAME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setfilename:file_number|filename?|extension?}
    // {setfilename:1|myfile}
    // {setfilename:1|myfile|txt}
    // {setfilename:1||txt}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, value, extension ] = split(arg, 3);

    key = await parseValue(context, tag, key);

    const fileId = parseInt(key) - 1;
    if (isNaN(fileId)) {
      return false;
    }

    if (value === undefined) {
      return false;
    }

    if (!(fileId in tag.files)) {
      throw new Error(tag.translate('tagscript.file_id_does_not_exist', {id: fileId + 1}));
    }

    const file = tag.files[fileId]!;

    const oldFileNameParts = file.filename.split('.');
    const oldFileExtension = (1 < oldFileNameParts.length) ? oldFileNameParts.pop()! : '';
    const oldFileName = oldFileNameParts.join('.');

    value = await parseValue(context, tag, value);
    if (!value) {
      value = oldFileName;
    }

    if (extension === undefined) {
      // they did not provide one, so use the one from the old filename
      extension = oldFileExtension;
    } else {
      extension = await parseValue(context, tag, extension);
    }

    file.filename = [value, extension].filter(Boolean).join('.');

    // todo: add character limit checks

    return true;
  },

  [TagFunctions.LOGICAL_SET_GLOBAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setglobal:variable|value}
    // {setglobal:lastused|{userid}}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, value ] = split(arg, 2);
    key = await parseValue(context, tag, key);

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    const storageValue = await parseValue(context, tag, value);
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      const storageId = '0';
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await putTagVariable(context, tagId, TagVariableStorageTypes.GLOBAL, storageId, {
        name: key,
        value: storageValue,
      });
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET_SERVER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setserver:variable|value}
    // {setserver:lastused|{userid}}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, value ] = split(arg, 2);
    key = await parseValue(context, tag, key);

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    const storageValue = await parseValue(context, tag, value);
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      const storageId = context.guildId || context.channelId!;
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await putTagVariable(context, tagId, TagVariableStorageTypes.GUILD, storageId, {
        name: key,
        value: storageValue,
      });
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET_USER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setuser:variable|value}
    // {setuser:lastused|{userid}}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, value ] = split(arg, 2);
    key = await parseValue(context, tag, key);

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(tag.translate('tagscript.storage_variable_cannot_be_more_than_characters', {max: tag.limits.MAX_STORAGE_KEY_LENGTH}));
    }

    const storageValue = await parseValue(context, tag, value);
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(tag.translate('tagscript.storage_variable_value_cannot_be_more_than', {max: tag.limits.MAX_STORAGE_VALUE_LENGTH}));
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      const storageId = context.userId;
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await putTagVariable(context, tagId, TagVariableStorageTypes.USER, storageId, {
        name: key,
        value: storageValue,
      });
    }

    return true;
  },

  [TagFunctions.MATH]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {math:5+5}

    const equation = arg.trim();

    const mathWorker = tag.context.mathWorker = tag.context.mathWorker || new MathWorker();
    try {
      tag.text += await withSyncTimeBudget(context, tag, () => mathWorker.evaluate(equation));
    } catch(error) {
      if (error.message.includes(MATH_ERROR_TIMEOUT_MESSAGE)) {
        throw new Error(tag.translate('tagscript.math_equation_timed_out'))
      } else {
        throw new Error(tag.translate('tagscript.math_equation_errored_out', {error: error.message}));
      }
    }

    return true;
  },

  [TagFunctions.MATH_ABS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {abs:number}

    const value = parseFloat(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.abs(value);

    return true;
  },

  [TagFunctions.MATH_COS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {cos:number}

    const value = parseFloat(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.cos(value);

    return true;
  },

  [TagFunctions.MATH_E]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {e}

    tag.text += Math.E;
    return true;
  },

  [TagFunctions.MATH_MAX]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {max:number|number|...}

    if (!arg) {
      return false;
    }

    // these used to drop the decimals (`{max:1.9|1.5}` gave `1`) and threw on things like `1e3`
    const numbers = split(arg).map(toPlainDecimal);
    if (numbers.some((x) => x === null)) {
      return false;
    }
    tag.text += (numbers as Array<string>).reduce((x, y) => (compareDecimals(y, x) > 0) ? y : x);

    return true;
  },

  [TagFunctions.MATH_MIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {min:number|number|...}

    if (!arg) {
      return false;
    }

    const numbers = split(arg).map(toPlainDecimal);
    if (numbers.some((x) => x === null)) {
      return false;
    }
    tag.text += (numbers as Array<string>).reduce((x, y) => (compareDecimals(y, x) < 0) ? y : x);

    return true;
  },

  [TagFunctions.MATH_PI]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {pi}

    tag.text += Math.PI;
    return true;
  },

  [TagFunctions.MATH_SIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {sin:number}

    const value = parseFloat(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.sin(value);

    return true;
  },

  [TagFunctions.MATH_TAN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tan:number}

    const value = parseFloat(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.tan(value);

    return true;
  },

  [TagFunctions.MEDIA]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get media from arg or last media
    // {media}
    // {media:cake}

    increaseNetworkRequests(tag);

    const url = await lastMediaUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.MEDIA_AUDIO]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get audio from arg or last audio
    // {audio}
    // {audio:cake}

    increaseNetworkRequests(tag);

    const url = await lastAudioUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.MEDIA_AUDIO_OR_VIDEO]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get audio/video from arg or last audio/video
    // {av}
    // {av:cake}

    increaseNetworkRequests(tag);

    const url = await lastAudioOrVideoUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.MEDIA_IMAGE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get image from arg or last image
    // {image}
    // {image:cake}

    increaseNetworkRequests(tag);

    const url = await lastImageUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    } else {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_IV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        return ScriptTags[fallbackFunction](context, arg, tag);
      }
    }

    return true;
  },

  [TagFunctions.MEDIA_IMAGE_EDIT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // edit an image based off a prompt, empty will auto generate one
    // {edit:PROMPT?|MEDIA_URL?}
    // {edit:pixelate the image}
    // {edit:pixelate the image|cake}
    // {edit:|cake}

    if (tag.limits.MAX_ATTACHMENTS === 0) {
      return false;
    }

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
    }

    increaseNetworkRequests(tag);
    increaseNetworkRequestsML(tag);
  
    const maxFileSize = context.maxAttachmentSize;

    let prompt: string;
    let mediaString: string = '';
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      const parts = split(arg);

      mediaString = parts.pop()!;
      prompt = parts.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    } else {
      prompt = arg;
    }

    let url = await lastImageUrl(mediaString.trim(), context);
    if (!url) {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_IV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        const textCache = tag.text;

        tag.text = '';
        await ScriptTags[fallbackFunction](context, mediaString, tag);
        url = tag.text;
        tag.text = textCache;
      }
    }

    if (!url) {
      return false;
    }

    const job = await utilitiesMLEdit(context, {
      query: prompt,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: true,
      urls: [url],
    },
    ).then((x) => jobWaitForResult(context, x));
    if (job.result.error) {
      throw new Error(tag.translate('tagscript.job_error', {error: job.result.error}));
    }
    if (!job.result.response) {
      throw new Error(tag.translate('tagscript.edit_did_not_return_a_response_should'));
    }

    const response = job.result.response;
    const filename = response.file.filename_safe;

    const data = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
    if (maxFileSize < data.length) {
      throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
    }

    assertTotalFileSize(context, tag, data.length);
    tag.variables[PrivateVariables.FILE_SIZE] += data.length;

    tag.files.push({
      buffer: data,
      filename,
      spoiler: false,
      url: '',
    });

    return true;
  },

  [TagFunctions.MEDIA_IMAGE_EDIT_URL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // edit an image based off a prompt, empty will auto generate one
    // {editurl:PROMPT?|MEDIA_URL?}
    // {editurl:pixelate the image}
    // {editurl:pixelate the image|cake}
    // {editurl:|cake}

    increaseNetworkRequests(tag);
    increaseNetworkRequestsML(tag);

    let prompt: string;
    let mediaString: string = '';
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      const parts = split(arg);

      mediaString = parts.pop()!;
      prompt = parts.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    } else {
      prompt = arg;
    }

    let url = await lastImageUrl(mediaString.trim(), context);
    if (!url) {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_IV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        const textCache = tag.text;

        tag.text = '';
        await ScriptTags[fallbackFunction](context, mediaString, tag);
        url = tag.text;
        tag.text = textCache;
      }
    }

    if (!url) {
      return true;
    }

    const job = await utilitiesMLEdit(context, {
      query: prompt,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: true,
      upload: true,
      uploadExpiresIn: (7 * 24 * 60 * 60),
      urls: [url],
    }).then((x) => jobWaitForResult(context, x));
    if (job.result.error) {
      throw new Error(tag.translate('tagscript.job_error', {error: job.result.error}));
    }
    if (!job.result.response) {
      throw new Error(tag.translate('tagscript.edit_did_not_return_a_response_should'));
    }

    const response = job.result.response;
    if (response.storage) {
      tag.text += response.storage.urls.cdn;
    }

    return true;
  },

  [TagFunctions.MEDIA_IMAGE_IMAGINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // imagine an image based off a prompt, empty will auto generate one
    // {imagine}
    // {imagine:cake}

    if (tag.limits.MAX_ATTACHMENTS === 0) {
      return false;
    }

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
    }

    increaseNetworkRequests(tag);
    increaseNetworkRequestsML(tag);

    const maxFileSize = context.maxAttachmentSize;

    const job = await utilitiesMLImagine(context, {
      query: arg,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: true,
    }).then((x) => jobWaitForResult(context, x));
    if (job.result.error) {
      throw new Error(tag.translate('tagscript.job_error', {error: job.result.error}));
    }
    if (!job.result.response) {
      throw new Error(tag.translate('tagscript.imagine_did_not_return_a_response_should'));
    }

    const response = job.result.response;
    const filename = response.file.filename_safe;

    const data = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
    if (maxFileSize < data.length) {
      throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
    }

    assertTotalFileSize(context, tag, data.length);
    tag.variables[PrivateVariables.FILE_SIZE] += data.length;

    tag.files.push({
      buffer: data,
      filename,
      spoiler: false,
      url: '',
    });

    return true;
  },

  [TagFunctions.MEDIA_IMAGE_IMAGINE_URL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // imagine an image based off a prompt, empty will auto generate one, will return a url
    // {imagineurl}
    // {imagineurl:cake}

    increaseNetworkRequests(tag);
    increaseNetworkRequestsML(tag);

    const job = await utilitiesMLImagine(context, {
      query: arg,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: true,
      upload: true,
      uploadExpiresIn: (7 * 24 * 60 * 60),
    }).then((x) => jobWaitForResult(context, x));
    if (job.result.error) {
      throw new Error(tag.translate('tagscript.job_error', {error: job.result.error}));
    }
    if (!job.result.response) {
      throw new Error(tag.translate('tagscript.imagine_did_not_return_a_response_should'));
    }

    const response = job.result.response;
    if (response.storage) {
      tag.text += response.storage.urls.cdn;
    }

    return true;
  },

  [TagFunctions.MEDIA_IMAGE_OR_VIDEO]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get image/video from arg or last image/video
    // {iv}
    // {iv:cake}

    increaseNetworkRequests(tag);

    const url = await lastImageOrVideoUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    } else {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_IV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        return ScriptTags[fallbackFunction](context, arg, tag);
      }
    }

    return true;
  },

  [TagFunctions.MEDIA_VIDEO]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get video from arg or last video
    // {video}
    // {video:cake}

    increaseNetworkRequests(tag);

    const url = await lastVideoUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.MESSAGE_CONTENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get message content from a message id
    // {messagecontent:MESSAGE_ID?|CHANNEL?}

    if (arg) {
      const [ messageId, channelQuery ] = split(arg, 2);
      if (!messageId) {
        return true;
      }

      let channelId: string = '';
      let channel: Structures.Channel | null = null;
      if (channelQuery) {
        increaseNetworkRequests(tag); // if its a snowflake, just check cache?
        channel = await findChannel(channelQuery, context);
        if (!channel || !channel.isText) {
          return true;
        }
        channelId = channel.id;
      } else {
        channel = context.channel;
        channelId = context.channelId!; // we dont get channel objects in dms
      }

      if (channel) {
        const member = context.member;
        if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
          throw new Error(tag.translate('tagscript.you_cannot_view_the_history_of_this'));
        }
        if (!channel.canReadHistory) {
          throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
        }
      } else if (!context.inDm && !context.hasServerPermissions) {
        throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
      }

      let message: Structures.Message | undefined;
      if (context.messages.has(messageId)) {
        message = context.messages.get(messageId)!;
      } else {
        increaseNetworkRequests(tag);
        try {
          message = await context.rest.fetchMessage(channelId, messageId);
        } catch(error) {

        }
      }
      if (message && message.channelId === channelId) {
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          return true;
        }
        tag.text += message.content;
      }
    } else if (context instanceof Command.Context) {
      tag.text += context.message.content;
    }

    return true;
  },

  [TagFunctions.MESSAGE_LAST_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get a random message id from the past 100 messages in a channel
    // {messagelastid:NUMBER?|CHANNEL_ID?}

    const [ indexQuery, channelQuery ] = split(arg, 2);

    let index: number = 0;
    if (indexQuery === 'random' || !isNaN(indexQuery as any)) {
      if (indexQuery === 'random') {
        index = -1;
      } else if (!isNaN(indexQuery as any)) {
        index = parseInt(indexQuery);
        if (isNaN(index)) {
          index = 0;
        }
      }
    }

    if (100 <= index) {
      throw new Error(tag.translate('tagscript.message_index_cannot_be_over_99'));
    }

    let channelId: string = '';
    let channel: Structures.Channel | null = null;
    if (channelQuery) {
      increaseNetworkRequests(tag); // if its a snowflake, just check cache?
      channel = await findChannel(channelQuery, context);
      if (!channel || !channel.isText) {
        return true;
      }
      channelId = channel.id;
    } else {
      channel = context.channel;
      channelId = context.channelId!; // we dont get channel objects in dms
    }

    if (channel) {
      const member = context.member;
      if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
        throw new Error(tag.translate('tagscript.you_cannot_view_the_history_of_this'));
      }
      if (!channel.canReadHistory) {
        throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
      }
    } else if (!context.inDm && !context.hasServerPermissions) {
      throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
    }

    // maybe dont show the bot's messages?

    const MAX_LIMIT = (index === -1) ? 100 : Math.min(100, index + 1);

    const messagesFound: Array<Structures.Message> = [];

    let before: string | undefined;
    if (channel) {
      // maybe make this use not the channel object (for dms)?
      for (let message of channel.messages.toArray().reverse()) {
        if (MAX_LIMIT <= messagesFound.length) {
          break;
        }
        if (context instanceof Command.Context && message.id === context.messageId) {
          continue;
        }
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          continue;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    if (messagesFound.length < MAX_LIMIT) {
      increaseNetworkRequests(tag);

      const limit = MAX_LIMIT - messagesFound.length;
      const messages = await context.rest.fetchMessages(channelId, {before, limit});
      for (let message of messages.toArray()) {
        // `messagesFound` already has the cached messages in it, comparing against `limit` stopped early
        // (50 cached and `{messagelastid:80}` gave nothing)
        if (MAX_LIMIT <= messagesFound.length) {
          break;
        }
        if (context instanceof Command.Context && message.id === context.messageId) {
          continue;
        }
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          continue;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    if (index === -1) {
      if (messagesFound.length) {
        const message = randomFromArray(messagesFound);
        tag.text += message.id;
      }
    } else if (index in messagesFound) {
      const message = messagesFound[index];
      if (message) {
        tag.text += message.id;
      }
    }
  
    return true;
  },

  [TagFunctions.MESSAGE_RANDOM_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get a random message id from the past 100 messages in a channel
    // {randmessageid:CHANNEL_ID?}

    const channelQuery = arg.trim();

    let channelId: string = '';
    let channel: Structures.Channel | null = null;
    if (channelQuery) {
      increaseNetworkRequests(tag); // if its a snowflake, just check cache?
      channel = await findChannel(channelQuery, context);
      if (!channel || !channel.isText) {
        return true;
      }
      channelId = channel.id;
    } else {
      channel = context.channel;
      channelId = context.channelId!; // we dont get channel objects in dms
    }

    if (channel) {
      const member = context.member;
      if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
        throw new Error(tag.translate('tagscript.you_cannot_view_the_history_of_this'));
      }
      if (!channel.canReadHistory) {
        throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
      }
    } else if (!context.inDm && !context.hasServerPermissions) {
      throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
    }

    // maybe dont show the bot's messages?

    const MAX_LIMIT = 100;

    const messagesFound: Array<Structures.Message> = [];

    let before: string | undefined;
    if (channel) {
      // maybe make this use not the channel object (for dms)?
      for (let message of channel.messages.toArray().reverse()) {
        if (MAX_LIMIT <= messagesFound.length) {
          break;
        }
        if (context instanceof Command.Context && message.id === context.messageId) {
          continue;
        }
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          continue;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    if (messagesFound.length < MAX_LIMIT) {
      increaseNetworkRequests(tag);

      const limit = MAX_LIMIT - messagesFound.length;
      const messages = await context.rest.fetchMessages(channelId, {before, limit});
      for (let message of messages.toArray()) {
        // `messagesFound` already has the cached messages in it, comparing against `limit` stopped early
        // (50 cached and `{messagelastid:80}` gave nothing)
        if (MAX_LIMIT <= messagesFound.length) {
          break;
        }
        if (context instanceof Command.Context && message.id === context.messageId) {
          continue;
        }
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          continue;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    if (messagesFound.length) {
      const message = randomFromArray(messagesFound);
      tag.text += message.id;
    }

    return true;
  },

  [TagFunctions.MESSAGE_USER_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get a message's author's id
    // {messageuserid:MESSAGE_ID?|CHANNEL_ID?}

    if (arg) {
      const [ messageId, channelQuery ] = split(arg, 2);
      if (!messageId) {
        return true;
      }

      let channelId: string = '';
      let channel: Structures.Channel | null = null;
      if (channelQuery) {
        increaseNetworkRequests(tag); // if its a snowflake, just check cache?
        channel = await findChannel(channelQuery, context);
        if (!channel || !channel.isText) {
          return true;
        }
        channelId = channel.id;
      } else {
        channel = context.channel;
        channelId = context.channelId!; // we dont get channel objects in dms
      }

      if (channel) {
        const member = context.member;
        if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
          throw new Error(tag.translate('tagscript.you_cannot_view_the_history_of_this'));
        }
        if (!channel.canReadHistory) {
          throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
        }
      } else if (!context.inDm && !context.hasServerPermissions) {
        throw new Error(tag.translate('tagscript.bot_cannot_view_the_history_of_this'));
      }

      let message: Structures.Message | undefined;
      if (context.messages.has(messageId)) {
        message = context.messages.get(messageId)!;
      } else {
        increaseNetworkRequests(tag);
        try {
          message = await context.rest.fetchMessage(channelId, messageId);
        } catch(error) {
      
        }
      }
      if (message && message.channelId === channelId) {
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          return true;
        }
        tag.text += message.author.id;
      }
    } else if (context instanceof Command.Context) {
      tag.text += context.message.author.id;
    }

    return true;
  },
 
  [TagFunctions.MEDIASCRIPT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // mediascript 1
    // {mediascript:mediascript code here}

    if (tag.limits.MAX_ATTACHMENTS === 0) {
      return false;
    }

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(tag.translate('tagscript.attachments_surpassed_max_attachments_length_of', {max: tag.limits.MAX_ATTACHMENTS}));
    }

    let code = arg.trim();
    if (!code) {
      return false;
    }

    const files: Array<RequestFile> = [];
    const keyCache: Record<string, string> = {};
    code = code.replace(URL_FILE_REPLACEMENT_REGEX, (match, group1, group2, offset) => {
      if (!(group1 in keyCache)) {
        const file = tag.files[parseInt(group1) - 1];
        if (!file) {
          throw new Error(tag.translate('tagscript.invalid_file_provided'));
        }
        if (!file.buffer) {
          // every reference to a url-only file is its url (this cached a FILE_n that was never sent, so later
          // references pointed at whichever file got that number next)
          keyCache[group1] = file.url;
          return file.url;
        }

        keyCache[group1] = `FILE_${files.length + 1}`;
        files.push({filename: file.filename, value: file.buffer});
        if (!group2) {
          // kill it from tag.files
          file.deleted = true;
        }
      }
      return keyCache[group1];
    });

    // backwards since splicing shifts the later files down
    for (let i = tag.files.length - 1; 0 <= i; i--) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseNetworkRequests(tag);

    try {
      const job = await utilitiesMediascript(context, {
        code,
        files,
        maxFileSizeStrict: true,
        mlDiffusionModel: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
        safe: DefaultParameters.safe(context),
      }).then((x) => jobWaitForResult(context, x));
      if (job.result.error) {
        throw new Error(tag.translate('tagscript.mediascript_error', {error: job.result.error}));
      }
      if (!job.result.response) {
        throw new Error(tag.translate('tagscript.mediascript_did_not_return_a_response_should'));
      }

      const response = job.result.response;
      if (response.arguments) {
        for (let key in response.arguments) {
          // stored as-is, going through {set} parsed the values as tagscript (a `{...}` in them ran) and cut them at `|`
          setVariableRaw(tag, key, response.arguments[key]);
        }
      }

      const filename = response.file.filename_safe;
      
      let data: Buffer | string = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
      if (response.file.metadata.mimetype.startsWith('text/')) {
        data = data.toString();
      }

      const maxFileSize = context.maxAttachmentSize;
      if (maxFileSize < data.length) {
        throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
      }
      assertTotalFileSize(context, tag, data.length);
      
      tag.variables[PrivateVariables.FILE_SIZE] += data.length;
      
      tag.files.push({
        buffer: data,
        filename,
        spoiler: false,
        url: '',
      });

    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.MEDIASCRIPT_MAYBE_URL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {mediascriptmaybeurl:mediascript code here}

    let code = arg.trim();
    if (!code) {
      return false;
    }

    const files: Array<RequestFile> = [];
    const keyCache: Record<string, string> = {};
    code = code.replace(URL_FILE_REPLACEMENT_REGEX, (match, group1, group2, offset) => {
      if (!(group1 in keyCache)) {
        const file = tag.files[parseInt(group1) - 1];
        if (!file) {
          throw new Error(tag.translate('tagscript.invalid_file_provided'));
        }
        if (!file.buffer) {
          // every reference to a url-only file is its url (this cached a FILE_n that was never sent, so later
          // references pointed at whichever file got that number next)
          keyCache[group1] = file.url;
          return file.url;
        }

        keyCache[group1] = `FILE_${files.length + 1}`;
        files.push({filename: file.filename, value: file.buffer});
        if (!group2) {
          // kill it from tag.files
          file.deleted = true;
        }
      }
      return keyCache[group1];
    });

    // backwards since splicing shifts the later files down
    for (let i = tag.files.length - 1; 0 <= i; i--) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseNetworkRequests(tag);

    try {
      const job = await utilitiesMediascript(context, {
        code,
        files,
        maxFileSizeStrict: false,
        mlDiffusionModel: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
        safe: DefaultParameters.safe(context),
      }).then((x) => jobWaitForResult(context, x));
      if (job.result.error) {
        throw new Error(tag.translate('tagscript.mediascript_error', {error: job.result.error}));
      }
      if (!job.result.response) {
        throw new Error(tag.translate('tagscript.mediascript_did_not_return_a_response_should'));
      }

      const response = job.result.response;
      if (response.arguments) {
        for (let key in response.arguments) {
          // stored as-is, going through {set} parsed the values as tagscript (a `{...}` in them ran) and cut them at `|`
          setVariableRaw(tag, key, response.arguments[key]);
        }
      }

      if (response.storage) {
        tag.text += response.storage.urls.cdn;
      } else {
        const maxFileSize = context.maxAttachmentSize;
        const filename = response.file.filename_safe;

        let data: Buffer | string = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
        if (response.file.metadata.mimetype.startsWith('text/')) {
          data = data.toString();
        }

        if (maxFileSize < data.length) {
          throw new Error(tag.translate('tagscript.attachment_surpassed_max_file_size_of_bytes', {max: maxFileSize}));
        }
        assertTotalFileSize(context, tag, data.length);

        tag.variables[PrivateVariables.FILE_SIZE] += data.length;

        tag.files.push({
          buffer: data,
          filename,
          spoiler: false,
          url: '',
        });
      }
    } catch(error) {
      throw error;
    }

    return true;
  },

  [TagFunctions.MEDIASCRIPT_URL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // mediascripturl 1
    // {mediascripturl:mediascript code here}

    let code = arg.trim();
    if (!code) {
      return false;
    }

    const files: Array<RequestFile> = [];
    const keyCache: Record<string, string> = {};
    code = code.replace(URL_FILE_REPLACEMENT_REGEX, (match, group1, group2, offset) => {
      if (!(group1 in keyCache)) {
        const file = tag.files[parseInt(group1) - 1];
        if (!file) {
          throw new Error(tag.translate('tagscript.invalid_file_provided'));
        }
        if (!file.buffer) {
          // every reference to a url-only file is its url (this cached a FILE_n that was never sent, so later
          // references pointed at whichever file got that number next)
          keyCache[group1] = file.url;
          return file.url;
        }

        keyCache[group1] = `FILE_${files.length + 1}`;
        files.push({filename: file.filename, value: file.buffer});
        if (!group2) {
          // kill it from tag.files
          file.deleted = true;
        }
      }
      return keyCache[group1];
    });

    // backwards since splicing shifts the later files down
    for (let i = tag.files.length - 1; 0 <= i; i--) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseNetworkRequests(tag);

    try {
      const job = await utilitiesMediascript(context, {
        code,
        files,
        maxFileSizeStrict: false,
        mlDiffusionModel: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
        safe: DefaultParameters.safe(context),
        upload: true,
        uploadExpiresIn: (7 * 24 * 60 * 60),
      }).then((x) => jobWaitForResult(context, x));
      if (job.result.error) {
        throw new Error(tag.translate('tagscript.mediascript_error', {error: job.result.error}));
      }
      if (!job.result.response) {
        throw new Error(tag.translate('tagscript.mediascript_did_not_return_a_response_should'));
      }

      const response = job.result.response;
      if (response.storage) {
        tag.text += response.storage.urls.cdn;
      }

      if (response.arguments) {
        for (let key in response.arguments) {
          // stored as-is, going through {set} parsed the values as tagscript (a `{...}` in them ran) and cut them at `|`
          setVariableRaw(tag, key, response.arguments[key]);
        }
      }

    } catch(error) {
      throw error;
    }

    return true;
  },

  [TagFunctions.NSFW]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // errors the command if the channel/user isnt suppose to use nsfw
    // {nsfw}

    if (DefaultParameters.safe(context)) {
      throw new Error(tag.translate('tagscript.cannot_use_a_nsfw_tag_here'));
    }

    return true;
  },

  [TagFunctions.NSFW_FILTER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns an empty string if the content is deemed NSFW, will cut to 2000 characters
    // {nsfwfilter:text}

    increaseNetworkRequests(tag);
    increaseNetworkRequestsSafety(tag);

    if (arg) {
      const [ isAwfulNSFW ] = await checkNSFW(context, arg.slice(0, 2000), {safe: DefaultParameters.safe(context)});
      if (!isAwfulNSFW) {
        tag.text += arg.slice(0, 2000);
      }
    }
  
    return true;
  },

  [TagFunctions.PAGE_JSON]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {pagejson:{"embed": {"title": "asd"}}}
    // {pagejson:[{"embed": {"title": "asd"}}]}
    // {pagejson:{"components": [{"type": 17, "components": [{"type": 10, "content": "asd"}]}]}}

    const pages: Array<any> = [];
    try {
      // {newline} inside of json strings becomes an actual newline
      let data = JSON.parse(arg.replace(REGEX_NEWLINE_SENTINEL, '\\n'));
      if (Array.isArray(data)) {
        for (let child of data) {
          pages.push(child);
        }
      } else {
        pages.push(data);
      }
    } catch(error) {
      throw new Error(tag.translate('tagscript.invalid_page_given'));
    }

    for (let page of pages) {
      let components: Array<Record<string, any>> | undefined;
      let content: string | undefined;
      let embeds: Array<Embed> | undefined;
      let filenames: Array<string> | undefined;
      if (typeof(page) !== 'object') {
        throw new Error(tag.translate('tagscript.invalid_page_given'));
      }
      if ('content' in page && typeof(page.content) === 'string') {
        content = page.content;
      }
      if ('embed' in page && typeof(page.embed) === 'object') {
        try {
          const embed = new Embed(page.embed);
          if (
            !embed.size &&
            (!embed.image || !embed.image.url) &&
            (!embed.thumbnail || !embed.thumbnail.url) &&
            (!embed.video || !embed.video.url)
          ) {
            throw new Error('this error doesn\'t matter');
          }
          embeds = [embed];
        } catch(error) {
          throw new Error(tag.translate('tagscript.invalid_page_given'));
        }
      }
      if ('files' in page && Array.isArray(page.files)) {
        for (let filename of page.files) {
          if (filename && typeof(filename) === 'string' && filename.startsWith('attachment://')) {
            if (!filenames) {
              filenames = [];
            }
            filenames.push(filename);
          }
        }
      }

      if ('components' in page) {
        components = parsePageComponents(page.components, tag);
      }

      if (!content && !embeds && !filenames && !components) {
        throw new Error(tag.translate('tagscript.invalid_page_given'));
      }

      tag.pages.push({components, content, embeds, filenames});

      if (tag.limits.MAX_PAGES < tag.pages.length) {
        throw new Error(tag.translate('tagscript.pages_surpassed_max_pages_length_of', {max: tag.limits.MAX_PAGES}));
      }
    }

    return true;
  },

  [TagFunctions.PREFIX]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // the prefix used
    // {prefix}

    if (context instanceof Interaction.InteractionContext) {
      tag.text += '/';
    } else {
      tag.text += context.prefix;
    }

    return true;
  },

  [TagFunctions.REPLY_CONTENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {replycontent}

    if (context instanceof Command.Context && context.message && context.message.referencedMessage) {
      const { content } = context.message.referencedMessage;
      tag.text += content;
    }

    return true;
  },

  [TagFunctions.REPLY_USER_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {replyuserid}

    if (context instanceof Command.Context && context.message && context.message.referencedMessage) {
      const { author } = context.message.referencedMessage;
      tag.text += author.id;
    }

    return true;
  },

  [TagFunctions.REQUEST]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {request:{headers, method, url}} jsonify body

    const options: RestOptions.UtilitiesProxyRequest = {method: '', url: ''};
    try {
      let object = JSON.parse(arg);
      if (typeof(object) !== 'object') {
        throw new TagRequestError('Request options are invalid.');
      }

      if (!('method' in object) || typeof(object.method) !== 'string') {
        throw new TagRequestError('Request method is invalid.');
      }

      options.method = object.method.trim().toUpperCase();
      if (!options.method || !(options.method in ProxyRequestMethods)) {
        throw new TagRequestError('Request method is invalid.');
      }

      if (!('url' in object) || typeof(object.url) !== 'string') {
        throw new TagRequestError('Request url is invalid.');
      }

      options.url = await Parameters.url(object.url.trim(), context);
      if (!options.url) {
        throw new TagRequestError('Request url is invalid.');
      }

      switch (options.method) {
        case ProxyRequestMethods.PATCH:
        case ProxyRequestMethods.POST:
        case ProxyRequestMethods.PUT: {
          // support {files: {key: filename}}
          if ('json' in object) {
            if (typeof(object.json) !== 'object') {
              throw new TagRequestError('Request json is invalid. (allowed: Object, Array)');
            }
            options.dataJSON = object.json;
          }
          if ('data' in object) {
            if ('json' in object) {
              throw new TagRequestError('Request cannot have both json and data.');
            }
            if (
              typeof(object.data) !== 'object' ||
              object.data === null ||
              Array.isArray(object.data) ||
              !Object.values(object.data).every((value) => ['boolean', 'number', 'string'].includes(typeof(value)))
            ) {
              throw new TagRequestError('Request data is invalid. (allowed: Record<string, string | number | boolean>)');
            }
            options.data = object.data;
          }
        }; break;
      }

      if ('headers' in object) {
        if (typeof(object.headers) !== 'object' || Array.isArray(object.headers)) {
          throw new TagRequestError('Request headers are invalid. (allowed: Record<string, string>)');
        }
        options.headers = object.headers;
      }

      if ('query' in object) {
        if (typeof(object.query) !== 'object' || Array.isArray(object.query)) {
          throw new TagRequestError('Request query is invalid. (allowed: Record<string, string>)');
        }
        options.query = object.query;
      }

    } catch(error) {
      if (error instanceof TagRequestError) {
        throw error;
      }
      throw new Error(tag.translate('tagscript.request_options_failed_to_parse'));
    }

    increaseNetworkRequests(tag);

    try {
      const response = await utilitiesProxyRequest(context, options);
      tag.text += JSON.stringify(response);
    } catch(error) {
      // the detailed errors used to be thrown inside the `try` that only meant to catch a bad json body, so they were
      // swallowed and everything came out as the generic `request_failed`
      if (error.response) {
        let information: any = null;
        try {
          information = await error.response.json();
        } catch(parseError) {

        }
        if (information && typeof(information) === 'object') {
          if ('errors' in information && information.errors && typeof(information.errors) === 'object') {
            const description: Array<string> = [];
            for (let key in information.errors) {
              const value = information.errors[key];
              let message: string;
              if (typeof(value) === 'object') {
                message = JSON.stringify(value);
              } else {
                message = String(value);
              }
              description.push(`**${key}**: ${message}`);
            }
            if (description.length) {
              throw new Error(tag.translate('tagscript.requested_failed', {details: description.join('\n')}));
            }
          }
          if ('message' in information && information.message) {
            throw new Error(String(information.message));
          }
        }
      }
      throw new Error(tag.translate('tagscript.request_failed'));
    }

    return true;
  },

  [TagFunctions.RNG_CHOOSE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {choose:50|100}
    // {choose:most frags|least frags}

    if (!arg) {
      return false;
    }

    let value: string;
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      const choices = split(arg);
      value = randomFromArray<string>(choices);
    } else {
      value = arg;
    }

    tag.text += await parseValue(context, tag, value);

    return true;
  },

  [TagFunctions.RNG_RANGE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {range:50}
    // {range:50|100}
    // {random:50|100}

    if (!arg) {
      return false;
    }

    let firstValue = '0', secondValue = '0';
    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      secondValue = arg.split('.').shift()!;
    } else {
      const firstSplitter = arg.indexOf(TagSymbols.SPLITTER_ARGUMENT);
      firstValue = arg.slice(0, firstSplitter).split('.').shift()!;
      secondValue = arg.slice(firstSplitter + 1).split('.').shift()!;
    }

    if (isNaN(firstValue as any) || isNaN(secondValue as any)) {
      return false;
    }

    tag.text += bigIntGenerateBetween(BigInt(firstValue), BigInt(secondValue));

    return true;
  },

  [TagFunctions.RNG_UUID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {uuid:version?}
    // {uuid:4}
    // {uuid:7}

    switch (arg) {
      case '':
      case '4': tag.text += crypto.randomUUID(); break;
      case '7': tag.text += randomUUIDv7(); break;
      default: {
        return false;
      };
    }

    return true;
  },

  [TagFunctions.SEARCH_DUCKDUCKGO_IMAGES]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {search.duckduckgo.images:cat}
    // {search.duckduckgo.images:1|cat}

    if (!arg) {
      return true;
    }

    let page = -1;
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      const firstSplitter = arg.indexOf(TagSymbols.SPLITTER_ARGUMENT);
      const firstValue = arg.slice(0, firstSplitter).trim().toLowerCase() || '0';
      if (firstValue === 'random' || !isNaN(firstValue as any)) {
        if (firstValue === 'random') {
          page = -1;
        } else if (!isNaN(firstValue as any)) {
          page = parseInt(firstValue);
          if (isNaN(page)) {
            page = 0;
          }
        }
        arg = arg.slice(firstSplitter + 1);
      }
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES] ||
      {}
    );

    arg = arg.slice(0, 1024);
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[arg] || await searchDuckDuckGoImages(context, {
      query: arg,
      safe: DefaultParameters.safe(context),
    });
    if (!(arg in cachedResults)) {
      cachedResults[arg] = response;
    }

    const { results } = response;
    // past the end gives the last result (this used `length`, which is one past the end, so it gave nothing)
    page = Math.min(page, results.length - 1);
    if (page === -1) {
      page = Math.floor(Math.random() * results.length);
    }
    page = Math.max(page, 0);

    const result = results[page];
    if (result) {
      tag.text += result.image;
    }
  
    return true;
  },

  [TagFunctions.SEARCH_GOOGLE_IMAGES]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {search.google.images:cat}
    // {search.google.images:1|cat}

    if (!arg) {
      return true;
    }

    let page = -1;
    if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      const firstSplitter = arg.indexOf(TagSymbols.SPLITTER_ARGUMENT);
      const firstValue = arg.slice(0, firstSplitter).trim().toLowerCase() || '0';
      if (firstValue === 'random' || !isNaN(firstValue as any)) {
        if (firstValue === 'random') {
          page = -1;
        } else if (!isNaN(firstValue as any)) {
          page = parseInt(firstValue);
          if (isNaN(page)) {
            page = 0;
          }
        }
        arg = arg.slice(firstSplitter + 1);
      }
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.SEARCH_GOOGLE_IMAGES] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.SEARCH_GOOGLE_IMAGES] ||
      {}
    );

    arg = arg.slice(0, 1024);
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const results = cachedResults[arg] || await searchGoogleImages(context, {
      query: arg,
      safe: DefaultParameters.safe(context),
    });
    if (!(arg in cachedResults)) {
      cachedResults[arg] = results;
    }

    // past the end gives the last result (this used `length`, which is one past the end, so it gave nothing)
    page = Math.min(page, results.length - 1);
    if (page === -1) {
      page = Math.floor(Math.random() * results.length);
    }
    page = Math.max(page, 0);

    const result = results[page];
    if (result) {
      tag.text += result.imageUrl;
    }

    return true;
  },

  [TagFunctions.SEARCH_YOUTUBE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {search.youtube:cat}

    if (!arg) {
      return true;
    }

    const cachedResults = tag.variables[PrivateVariables.RESULTS][TagFunctions.SEARCH_YOUTUBE] = (
      tag.variables[PrivateVariables.RESULTS][TagFunctions.SEARCH_YOUTUBE] ||
      {}
    );

    arg = arg.slice(0, 1024);
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[arg] || await searchYoutube(context, {
      query: arg,
    });
    if (!(arg in cachedResults)) {
      cachedResults[arg] = response;
    }

    const result = response.results.find((x) => x.type === YoutubeResultTypes.VIDEO);
    if (result) {
      tag.text += result.url;
    }

    return true;
  },

  [TagFunctions.SETTINGS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {settings:SETTING|VALUE}
    // {settings:MEDIA_IV_FALLBACK|search.google.images}
    // {settings:MEDIA_IV_FALLBACK|SEARCH_GOOGLE_IMAGES}
    // {settings:ML_IMAGINE_DO_NOT_ERROR|} (empty value clears it)

    const parts = split(arg);
    if (parts.length !== 2) {
      return false;
    }

    const settingValue = parts[0].trim();
    let value = parts[1].trim();

    const setting = settingValue.toUpperCase() as TagSettings;
    if (!(setting in TagSettings)) {
      return false;
    }

    const settings = tag.variables[PrivateVariables.SETTINGS];
    switch (setting) {
      case TagSettings.AI_PERSONALITY: {
        if (value) {
          settings[setting] = value;
        } else {
          delete settings[setting];
        }
      }; break;
      case TagSettings.AI_MODEL: {
        if (value) {
          value = value.toUpperCase();
          if (value in TagGenerationModels) {
            settings[setting] = value as TagGenerationModels;
          } else {
            throw new Error(tag.translate('tagscript.ai_model_must_be_one_of', {choices: Object.values(TagGenerationModels).map((x) => Markup.codestring(x)).join(', ')}));
          }
        } else {
          delete settings[setting];
        }
      }; break;
      case TagSettings.ALLOW_COMPONENT_EXECUTIONS_FROM_EVERYONE:
      case TagSettings.DISPLAY_MEDIA_AS_NATIVE:
      case TagSettings.ML_IMAGINE_DO_NOT_ERROR: {
        // false (or empty) clears it, since false is the default
        if (value && textToBoolean(value)) {
          settings[setting] = true;
        } else {
          delete settings[setting];
        }
      }; break;
      case TagSettings.MEDIA_AV_FALLBACK: {
        if (value) {
          const parsedValue = parseFallbackSetting(value, {
            [TagFunctions.SEARCH_YOUTUBE]: [TagFunctions.SEARCH_YOUTUBE],
          });
          if (parsedValue) {
            settings[setting] = parsedValue as TagFunctions.SEARCH_YOUTUBE;
          }
        } else {
          delete settings[setting];
        }
      }; break;
      case TagSettings.MEDIA_IV_FALLBACK: {
        if (value) {
          // imagine falls back to the url version, the media functions need a url back (not an attached file)
          const parsedValue = parseFallbackSetting(value, {
            [TagFunctions.MEDIA_IMAGE_IMAGINE_URL]: [TagFunctions.MEDIA_IMAGE_IMAGINE, TagFunctions.MEDIA_IMAGE_IMAGINE_URL],
            [TagFunctions.SEARCH_DUCKDUCKGO_IMAGES]: [TagFunctions.SEARCH_DUCKDUCKGO_IMAGES, 'SEARCH_DUCK_DUCK_GO_IMAGES'],
            [TagFunctions.SEARCH_GOOGLE_IMAGES]: [TagFunctions.SEARCH_GOOGLE_IMAGES],
          });
          if (parsedValue) {
            settings[setting] = parsedValue as TagFunctions.MEDIA_IMAGE_IMAGINE_URL | TagFunctions.SEARCH_DUCKDUCKGO_IMAGES | TagFunctions.SEARCH_GOOGLE_IMAGES;
          }
        } else {
          delete settings[setting];
        }
      }; break;
      case TagSettings.ML_IMAGINE_MODEL: {
        if (value) {
          value = value.toUpperCase();
          if (value in MLDiffusionModels) {
            settings[setting] = value as MLDiffusionModels;
          } else {
            throw new Error(tag.translate('tagscript.ml_imagine_model_must_be_one_of', {choices: Object.values(MLDiffusionModels).map((x) => Markup.codestring(x)).join(', ')}));
          }
        } else {
          delete settings[setting];
        }
      }; break;
      default: {
        throw new Error(tag.translate('tagscript.settings_must_be_one_of', {choices: Object.values(TagSettings).join(', ')}));
        return false;
      };
    }

    return true;
  },

  [TagFunctions.SETTINGS_SET_SERVER_AI_PERSONALITY]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {settings.set.server.ai.personality:prompt?}

    return false;
  },

  [TagFunctions.SETTINGS_SET_USER_AI_PERSONALITY]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {settings.set.user.ai.personality:prompt?}
    // only NotSoAI can use this

    if (!isFromAI(context, tag)) {
      return false;
    }

    const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (!oldSettings) {
      throw new Error(tag.translate('tagscript.error_fetching_your_current_ai_model_preference'))
    }

    if (!arg) {
      tag.text += oldSettings.ml_llm_personality || '';
      return true;
    }

    const personality = (arg.toLowerCase() === 'clear') ? null :  arg;
    if (oldSettings.ml_llm_personality === personality) {
      tag.text += String(false);
    } else {
      const settings = await editUserSettings(context, context.userId, {
        mlLLMPersonality: personality,
      });
      UserSettingsStore.insert(context.userId, settings);

      tag.text += String(true);
    }

    return true;
  },

  [TagFunctions.SETTINGS_SET_USER_LOCALE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {settings.set.user.locale:locale?}
    // only NotSoAI can use this, empty outputs the current locale, `clear` clears it

    if (!isFromAI(context, tag)) {
      return false;
    }

    const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (!oldSettings) {
      throw new Error('Error fetching your current locale preference');
    }

    arg = arg.trim();
    if (!arg) {
      tag.text += oldSettings.locale || '';
      return true;
    }

    const locale = (arg.toLowerCase() === 'clear') ? null : await Parameters.locale(arg, context);
    if (oldSettings.locale === locale) {
      tag.text += String(false);
    } else {
      increaseNetworkRequests(tag);
      const settings = await editUserSettings(context, context.userId, {locale});
      UserSettingsStore.insert(context.userId, settings);

      tag.text += String(true);
    }

    return true;
  },

  [TagFunctions.SETTINGS_SET_USER_TIMEZONE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {settings.set.user.timezone:timezone?}
    // only NotSoAI can use this, empty outputs the current timezone, `clear` clears it

    if (!isFromAI(context, tag)) {
      return false;
    }

    const oldSettings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (!oldSettings) {
      throw new Error('Error fetching your current timezone preference');
    }

    arg = arg.trim();
    if (!arg) {
      tag.text += oldSettings.timezone || '';
      return true;
    }

    let timezone: string | null = null;
    if (arg.toLowerCase() !== 'clear') {
      timezone = resolveTimezone(arg);
      if (!timezone) {
        throw new Error(`Unknown timezone \`${arg.slice(0, 64)}\`, use an IANA name like \`America/New_York\``);
      }
    }

    if (oldSettings.timezone === timezone) {
      tag.text += String(false);
    } else {
      increaseNetworkRequests(tag);
      const settings = await editUserSettings(context, context.userId, {timezone});
      UserSettingsStore.insert(context.userId, settings);

      tag.text += String(true);
    }

    return true;
  },

  [TagFunctions.STRING_INDEX_OF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {indexof:string|text}
    // {indexof:,|the cat jumped, over a dog}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ indexValue, text ] = split(arg, 2);

    indexValue = await parseValue(context, tag, indexValue);
    text = await parseValue(context, tag, text);

    tag.text += text.indexOf(indexValue);

    return true;
  },

  [TagFunctions.STRING_JSONIFY]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {jsonify:text}

    tag.text += JSON.stringify(arg);
    return true;
  },

  [TagFunctions.STRING_ONE_OF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {oneof:choices1|choice2|choice3|...}
  
    if (!arg) {
      return false;
    }

    const [ value, ...choices ] = split(arg);
    if (!value || !choices.length) {
      return true;
    }

    {
      const insensitive = value.toLowerCase();
      for (let choice of choices) {
        if (choice.toLowerCase().includes(insensitive)) {
          tag.text += choice;
          return true;
        }
      }
    }

    const search = new MiniSearch({
      fields: ['id'],
      storeFields: ['id'],
      searchOptions: {
        fuzzy: true,
        prefix: true,
      },
    });
    search.addAll(choices.map((id) => ({id})));

    const results = search.search(value);
    if (results.length) {
      tag.text += results[0].id!;
    }

    return true;
  },

  [TagFunctions.STRING_LENGTH]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {len:text}

    tag.text += arg.length;
    return true;
  },

  [TagFunctions.STRING_LOWER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {lower:text}

    tag.text += arg.toLowerCase();
    return true;
  },

  [TagFunctions.STRING_MARKUP_BOLD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupbold:text}

    tag.text += Markup.bold(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_CODEBLOCK]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupcodeblock:text}
  
    tag.text += Markup.codeblock(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_CODESTRING]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupcodestring:text}

    tag.text += Markup.codestring(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_ESCAPE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupescape:text}

    tag.text += Markup.escape.all(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_HEADER_BIG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupheaderbig:text}

    tag.text += Markup.headerBig(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_HEADER_MEDIUM]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupheadermedium:text}

    tag.text += Markup.headerMedium(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_HEADER_SMALL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupheadersmall:text}

    tag.text += Markup.headerSmall(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_ITALICS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupitalics:text}
  
    tag.text += Markup.italics(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_LIST_DOTTED]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markuplistdotted:text|text|...}

    tag.text += split(arg).map((x) => {
      return Markup.list(x);
    }).join('\n');

    return true;
  },

  [TagFunctions.STRING_MARKUP_LIST_NUMBERED]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markuplistnumbered:text|text|...}

    tag.text += split(arg).map((x, i) => {
      return Markup.list(x, {ordered: i + 1});
    }).join('\n');
  
    return true;
  },

  [TagFunctions.STRING_MARKUP_QUOTE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupquote:text}

    tag.text += Markup.quote(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_SPOILER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupspoiler:text}

    tag.text += Markup.spoiler(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_STRIKE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupstrike:text}

    tag.text += Markup.strike(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_SUBTEXT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupsubtext:text}

    tag.text += Markup.subtext(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_TIME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markuptime:timestamp?|format?}
    // {markuptime:RELATIVE}
    // {markuptime:1700000000000|R}

    let format: MarkupTimestampStyles | undefined;
    let timestamp: string = '';
    if (arg.length) {
      format = parseMarkupTimestampStyle(arg);
      if (format) {
        // only the format was given
      } else if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
        const parts = split(arg);

        const suspectedFormat = parts.pop()!;
        format = parseMarkupTimestampStyle(suspectedFormat);
        if (!format) {
          parts.push(suspectedFormat);
        }
        timestamp = parts.join(TagSymbols.SPLITTER_ARGUMENT).trim();
      } else {
        timestamp = arg.trim();
      }
    }

    let date: Date;
    if (!timestamp) {
      date = new Date();
    } else if (/^-?[0-9]+$/.test(timestamp)) {
      // milliseconds
      date = new Date(parseInt(timestamp));
    } else {
      // date string
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return false;
    }

    tag.text += Markup.timestamp(date, format);
    return true;
  },

  [TagFunctions.STRING_MARKUP_UNDERLINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupunderline:text}

    tag.text += Markup.underline(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_URL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupurl:text|url|comment?}

    let [ text, url, comment ] = split(arg, 3);

    tag.text += Markup.url(text, url, comment);
    return true;
  },

  [TagFunctions.STRING_REPEAT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {repeat:50|lol}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    const [ amountText, ...value ] = split(arg);
    const amount = parseInt(amountText.trim());
    if (isNaN(amount)) {
      return false;
    }

    const text = value.join(TagSymbols.SPLITTER_ARGUMENT).trim();

    const maxTextLength = getMaxTextLength(context, tag);
    if (maxTextLength < (text.length * amount) + tag.text.length) {
      throw new Error(tag.translate('tagscript.text_exceeded_bytes', {max: maxTextLength}));
    }
    tag.text += text.repeat(amount);

    return true;
  },

  [TagFunctions.STRING_REPLACE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {replace:regex|with|in}
    // {replace:(cake\|josh)|tom|cake went with josh to the store}
    // {replace:"|in:"help"|with:'}
    // {replace:"|with:'|in:"help"}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ regex, part1, ...part2s ] = split(arg);
    if (regex === undefined || part1 === undefined || !part2s.length) {
      return false;
    }

    let part2 = part2s.join(TagSymbols.SPLITTER_ARGUMENT);

    let replaceWith = '';
    let source = '';

    if (part1.startsWith('with:')) {
      replaceWith = part1.slice(5);
      source = part2;
    } else if (part2.startsWith('with:')) {
      replaceWith = part2.slice(5);
      source = part1;
    } else {
      replaceWith = part1;
      source = part2;
    }
    if (source.startsWith('in:')) {
      source = source.slice(3);
    }

    tag.text += await withSyncTimeBudget(context, tag, () => {
      try {
        return vm.runInNewContext(
          `source.replace(new RegExp(regex, 'gi'), replaceWith);`,
          {
            regex: regex.trim(),
            source,
            replaceWith,
          },
          {timeout: tag.limits.MAX_TIME_REGEX},
        );
      } catch {
        throw new Error(tag.translate('tagscript.text_replacing_errored_or_timed_out'));
      }
    });

    return true;
  },

  [TagFunctions.STRING_REVERSE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {reverse:text}

    tag.text += arg.split('').reverse().join('');
    return true;
  },

  [TagFunctions.STRING_SUB]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {substring:text|start}
    // {substring:text|start|end}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    const [ text, startText, endText ] = split(arg, 3);
    if (!text || !startText) {
      return false;
    }

    const start = parseInt(await parseValue(context, tag, startText));
    if (isNaN(start)) {
      return false;
    }

    let end: number | undefined;
    if (endText !== undefined) {
      end = await parseInt(await parseValue(context, tag, endText));
      if (isNaN(end)) {
        return false;
      }
    }

    const parsedText = await parseValue(context, tag, text);
    tag.text += parsedText.substring(start, end);

    return true;
  },

  [TagFunctions.STRING_TRANSLATE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // translate some text
    // {translate:TEXT|LANGUAGE?}
    // {translate:cake}
    // {translate:cake|russian}

    increaseNetworkRequests(tag);

    if (arg.length) {
      const parts = split(arg);

      let text: string;

      let language: GoogleLocales;
      if (2 <= parts.length) {
        const suspectedLanguage = parts.pop()!;
        try {
          language = await Parameters.locale(suspectedLanguage, context);
        } catch(error) {
          parts.push(suspectedLanguage);
          language = await Parameters.locale('', context);
        }

        text = parts.join(TagSymbols.SPLITTER_ARGUMENT).trim();
      } else {
        language = await Parameters.locale('', context);
        text = parts[0]!;
      }

      if (text) {
        try {
          const { translated_text: translatedText } = await googleTranslate(context, {text, to: language});
          tag.text += translatedText.trim();
        } catch(error) {

        }
      }
    }

    return true;
  },

  [TagFunctions.STRING_UPPER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {upper:text}

    tag.text += arg.toUpperCase();
    return true;
  },

  [TagFunctions.STRING_URL_ENCODE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {url:text}

    tag.text += encodeURIComponent(arg);
    return true;
  },

  [TagFunctions.TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tag:tag_id|arguments}

    let [ tagId, tagArguments ] = split(arg, 2);
    tagId = tagId.trim();
    tagArguments = tagArguments || '';
    if (!tagId || !isSnowflake(tagId)) {
      throw new Error(tag.translate('tagscript.invalid_tag_id'));
    }

    // ignore tag executions in code and componentjson
    if (tag.variables[PrivateVariables.IS_FROM_CHILD_PARSING]) {
      return false;
    }

    increaseTagExecutions(tag);
    increaseNetworkRequests(tag);

    try {
      const fetchedTag = await fetchTagId(context, tagId);

      let isAllowed = fetchedTag.is_on_directory || (fetchedTag.server_id === (context.guildId || context.channelId));
      if (!isAllowed && (context.metadata && context.metadata.tag)) {
        // see if it's from the current tag owner's dms
        const user = await UserStore.getOrFetch(context, context.metadata.tag.user.id);
        if (user) {
          isAllowed = (fetchedTag.server_id === user.channelId);
        }
      }

      if (!isAllowed) {
        throw new Error(tag.translate('tagscript.cannot_call_this_tag'));
        return false;
      }

      await increaseUsage(context, fetchedTag);

      const oldTag = context.metadata && context.metadata.tag;

      const oldVariables = Object.assign({}, tag.variables);
      const variables = Object.create(null);
      if (oldTag && oldTag.id === fetchedTag.id) {
        Object.assign(variables, oldVariables);
      } else {
        for (let key in PrivateVariables) {
          const storedKey = (PrivateVariables as any)[key];
          variables[storedKey] = tag.variables[storedKey];
        }
      }
      variables[PrivateVariables.ARGS_STRING] = tagArguments;
      variables[PrivateVariables.ARGS] = Parameters.stringArguments(tagArguments);
      // the called tag is a user's tag, even if NotSoAI called it
      variables[PrivateVariables.IS_FROM_AI] = 0;

      if (context.metadata && context.metadata.tag) {
        variables[PrivateVariables.PARENT_TAG_ID] = context.metadata.tag.id;
      }

      if (context.metadata) {
        context.metadata.tag = fetchedTag;
      }

      // always restore the calling tag, even if the called tag errors (like inside of {iferror})
      // otherwise storage functions after this would read/write the called tag's storage
      try {
        const tagContent = (fetchedTag.reference_tag) ? fetchedTag.reference_tag.content : fetchedTag.content;
        const argParsed = await parse(context, tagContent, tagArguments, variables, tag.context, tag.limits, tag.files, true, {
          unescapeText: tag.unescapesText,
        });
        normalizeTagResults(tag, argParsed);

        if (oldTag && oldTag.id === fetchedTag.id) {
          Object.assign(tag.variables, argParsed.variables);
        } else {
          for (let key in PrivateVariables) {
            const storedKey = (PrivateVariables as any)[key];
            tag.variables[storedKey] = argParsed.variables[storedKey];
          }
        }
      } catch(error) {
        // keep whatever limits the called tag used up, `parse` uses the same `variables` object we gave it
        for (let storedKey of TAG_LIMIT_VARIABLES) {
          if (storedKey in variables) {
            tag.variables[storedKey] = variables[storedKey];
          }
        }
        throw error;
      } finally {
        tag.variables[PrivateVariables.ARGS_STRING] = oldVariables[PrivateVariables.ARGS_STRING];
        tag.variables[PrivateVariables.ARGS] = oldVariables[PrivateVariables.ARGS];
        tag.variables[PrivateVariables.PARENT_TAG_ID] = oldVariables[PrivateVariables.PARENT_TAG_ID];
        tag.variables[PrivateVariables.IS_FROM_AI] = oldVariables[PrivateVariables.IS_FROM_AI];

        if (context.metadata) {
          context.metadata.tag = oldTag;
        }
      }
    } catch(error) {
      throw error;
      return false;
    }

    return true;
  },

  [TagFunctions.TAG_CONTENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tagcontent}

    if (context.metadata && context.metadata.tag) {
      const currentTag = context.metadata.tag;
      tag.text += (currentTag.reference_tag) ? currentTag.reference_tag.content : currentTag.content;
    }

    return true;
  },

  [TagFunctions.TAG_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tagid}
  
    if (context.metadata && context.metadata.tag) {
      tag.text += context.metadata.tag.id;
    }
  
    return true;
  },

  [TagFunctions.TAG_NAME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tagname}

    if (context.metadata && context.metadata.tag) {
      tag.text += context.metadata.tag.name;
    }

    return true;
  },

  [TagFunctions.TAG_OWNER_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tagownerid}

    if (context.metadata && context.metadata.tag) {
      tag.text += context.metadata.tag.user.id;
    }

    return true;
  },

  [TagFunctions.TEXT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {text:https://google.com}

    const url = await Parameters.url(arg.trim(), context);
    increaseNetworkRequests(tag);

    try {
      const maxFileSize = context.maxAttachmentSize;
      const response = await utilitiesFetchText(context, {maxFileSize, url});

      const text = await response.text();
      appendTagText(context, tag, text);

    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.TEXT_FROM_HTML]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {textfromhtml:https://google.com}

    const url = await Parameters.url(arg.trim(), context);
    increaseNetworkRequests(tag);

    try {
      const maxFileSize = context.maxAttachmentSize;
      const response = await utilitiesFetchText(context, {
        maxFileSize,
        stripHtml: true,
        url,
      });

      const text = await response.text();
      appendTagText(context, tag, text);
    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.TIME_UNIX]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {unix}
    // {unix:time string}

    if (arg) {
      try {
        const result = Parameters.nlpTimestamp(arg, context);
        tag.text += result.start.getTime();
      } catch(error) {
        
      }
    } else {
      tag.text += Date.now();
    }

    return true;
  },

  [TagFunctions.TIME_UNIX_FROM_SNOWFLAKE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {unixsnowflake:SNOWFLAKE}

    if (arg) {
      tag.text += Snowflake.timestamp(arg);
    }

    return true;
  },

  [TagFunctions.TIME_UNIX_SECONDS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {unixs}
    // {unixs:time string}

    if (arg) {
      try {
        const result = Parameters.nlpTimestamp(arg, context);
        tag.text += Math.floor(result.start.getTime() / 1000);
      } catch(error) {
        
      }
    } else {
      tag.text += Math.floor(Date.now() / 1000);
    }

    return true;
  },

  [TagFunctions.TRANSCRIBE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // transcribe an audio/video clip
    // {transcribe:URL?}

    increaseNetworkRequests(tag);

    let url = await lastAudioOrVideoUrl(arg.trim(), context);
    if (!url) {
      const fallbackFunction = tag.variables[PrivateVariables.SETTINGS][TagSettings.MEDIA_AV_FALLBACK];
      if (fallbackFunction && fallbackFunction in ScriptTags) {
        const textCache = tag.text;

        tag.text = '';
        await ScriptTags[fallbackFunction](context, arg, tag);
        url = tag.text;
        tag.text = textCache;
      }
    }

    if (url) {
      try {
        const { duration, languages, text } = await mediaAVToolsTranscribe(context, {url});
        if (text) {
          tag.text += text;
        }
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.TRAVERSE_JSON]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {traversejson:string|json}
    // {traversejson:cake[0].test|{"cake":[{"test":"a"}]}}
  
    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    const [ path, text ] = split(arg, 2);
    if (!path || !text) {
      return false;
    }

    try {
      const object = JSON.parse(text);
      const result = traverseJSON(object, path);
      if (result !== undefined) {
        tag.text += (typeof(result) === 'object') ? JSON.stringify(result) : result;
      }
    } catch(error) {
      return false;
    }

    return true;
  },

  [TagFunctions.TYPE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {type:type|variable|default?}
    // {type:number|asd|0}
  
    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ type, text, defaultValue ] = split(arg, 3);
    if (!type) {
      return false;
    }

    switch (type.toLowerCase()) {
      case 'float': {
        let value = parseFloat(text);
        if (isNaN(value)) {
          if (!defaultValue) {
            return true;
          }
          value = parseFloat(defaultValue);
        }
        if (isNaN(value)) {
          return false;
        }
        tag.text += value;
      }; break;
      case 'number': {
        let value = parseInt(text);
        if (isNaN(value)) {
          if (!defaultValue) {
            return true;
          }
          value = parseInt(defaultValue);
        }
        if (isNaN(value)) {
          return false;
        }
        tag.text += value;
      }; break;
      default: {
        return false;
      };
    }
  
    return true;
  },

  [TagFunctions.USER_AVATAR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {useravatar}
    // {useravatar:user}
  
    if (arg) {
      increaseNetworkRequests(tag);
      const memberOrUser = await findMemberOrUser(arg, context);
      if (memberOrUser) {
        if (memberOrUser instanceof Structures.Member) {
          tag.text += memberOrUser.user.avatarUrlFormat({size: 1024});
        } else {
          tag.text += memberOrUser.avatarUrlFormat({size: 1024});
        }
      }
    } else {
      tag.text += context.user.avatarUrlFormat({size: 1024});
    }
  
    return true;
  },

  [TagFunctions.USER_DISCRIMINATOR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {discrim}
    // {discrim:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.discriminator;
      }
    } else {
      tag.text += context.user.discriminator;
    }

    return true;
  },

  [TagFunctions.USER_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {id}
    // {id:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.id;
      }
    } else {
      tag.text += context.user.id;
    }

    return true;
  },

  [TagFunctions.USER_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {mention}
    // {mention:user}
  
    if (arg) {
      increaseNetworkRequests(tag);
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.mention;
      }
    } else {
      tag.text += context.user.mention;
    }
    return true;
  },

  [TagFunctions.USER_NAME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {name}
    // {name:user}
  
    if (arg) {
      increaseNetworkRequests(tag);
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.username;
      }
    } else {
      tag.text += context.user.username;
    }
  
    return true;
  },

  [TagFunctions.USER_NICK]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {nick}
    // {nick:user}
  
    if (arg) {
      increaseNetworkRequests(tag);
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.name;
      }
    } else {
      tag.text += (context.member) ? context.member.name : context.user.name;
    }
  
    return true;
  },

  [TagFunctions.USER_RANDOM]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {randuser}

    // make sure guild is ready `Guild.ready` before getting a random member
    if (context.guild) {
      if (!context.guild.isReady) {
        await context.guild.requestMembers({
          limit: 0,
          presences: true,
          query: '',
          timeout: 10000,
        });
      }
      const member = randomFromIterator<Structures.Member>(context.guild.members.length, context.guild.members.values());
      tag.text += member.name;
    } else {
      // is dm
      const user = randomFromArray<Structures.User>([context.user, context.client.user as Structures.User]);
      tag.text += user.name;
    }
    return true;
  },

  [TagFunctions.USER_RANDOM_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {randuserid}

    // make sure guild is ready `Guild.ready` before getting a random member
    if (context.guild) {
      if (!context.guild.isReady) {
        await context.guild.requestMembers({
          limit: 0,
          presences: true,
          query: '',
          timeout: 10000,
        });
      }
      const member = randomFromIterator<Structures.Member>(context.guild.members.length, context.guild.members.values());
      tag.text += member.id;
    } else {
      // is dm
      const user = randomFromArray<Structures.User>([context.user, context.client.user as Structures.User]);
      tag.text += user.id;
    }
    return true;
  },

  [TagFunctions.USER_RANDOM_ONLINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {randonline}

    // all online users are already in cache pretty sure
    if (context.guild) {
      // no presences cached (no presence intent, or everyone offline) used to crash on `undefined`, use the invoker
      const online = context.guild.members.filter((member) => !!member.presence);
      const member = (online.length) ? randomFromArray<Structures.Member>(online) : (context.member || context.user);
      tag.text += member.name;
    } else {
      // is dm
      const user = randomFromArray<Structures.User>([context.user, context.client.user as Structures.User]);
      tag.text += user.name;
    }
    return true;
  },

  [TagFunctions.USER_RANDOM_ONLINE_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {randonlineid}

    // all online users are already in cache pretty sure
    if (context.guild) {
      // no presences cached (no presence intent, or everyone offline) used to crash on `undefined`, use the invoker
      const online = context.guild.members.filter((member) => !!member.presence);
      const member = (online.length) ? randomFromArray<Structures.Member>(online) : (context.member || context.user);
      tag.text += member.id;
    } else {
      // is dm
      const user = randomFromArray<Structures.User>([context.user, context.client.user as Structures.User]);
      tag.text += user.id;
    }
    return true;
  },

  [TagFunctions.USER_RANDOM_ONLINE_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {randonlinetag}

    // all online users are already in cache pretty sure
    if (context.guild) {
      // no presences cached (no presence intent, or everyone offline) used to crash on `undefined`, use the invoker
      const online = context.guild.members.filter((member) => !!member.presence);
      const member = (online.length) ? randomFromArray<Structures.Member>(online) : (context.member || context.user);
      tag.text += member.toString();
    } else {
      // is dm
      const user = randomFromArray<Structures.User>([context.user, context.client.user as Structures.User]);
      tag.text += user.toString();
    }
    return true;
  },

  [TagFunctions.USER_RANDOM_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {randusertag}

    // make sure guild is ready `Guild.ready` before getting a random member
    if (context.guild) {
      if (!context.guild.isReady) {
        await context.guild.requestMembers({
          limit: 0,
          presences: true,
          query: '',
          timeout: 10000,
        });
      }
      const member = randomFromIterator<Structures.Member>(context.guild.members.length, context.guild.members.values());
      tag.text += member.toString();
    } else {
      // is dm
      const user = randomFromArray<Structures.User>([context.user, context.client.user as Structures.User]);
      tag.text += user.toString();
    }
    return true;
  },

  [TagFunctions.USER_STATUS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {userstatus}
    // {userstatus:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const memberOrUser = await findMemberOrUser(arg, context);
      if (memberOrUser && memberOrUser instanceof Structures.Member) {
        const presence = memberOrUser.presence;
        tag.text += (presence) ? presence.status : 'offline';
      }
    } else {
      const member = context.member;
      if (member) {
        const presence = member.presence;
        tag.text += (presence) ? presence.status : 'offline';
      }
    }

    return true;
  },

  [TagFunctions.USER_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {usertag}
    // {usertag:user}

    if (arg) {
      increaseNetworkRequests(tag);
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.toString();
      }
    } else {
      tag.text += context.user.toString();
    }
    return true;
  },

  [TagFunctions.VARIABLES]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {variables}

    tag.text += JSON.stringify(tag.variables);

    return true;
  },

  [TagFunctions.VARIABLES_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {variableschannel}

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    const storage: {
      channel: Record<string, string>,
      global: Record<string, string>,
      server: Record<string, string>,
      user: Record<string, string>,
    } = {channel: {}, global: {}, server: {}, user: {}};

    if (tagId) {
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await fetchTagVariables(context, tagId, {
        channelId: context.channelId!,
        guildId: context.guildId,
        userId: context.userId,
      });
      for (let key of Object.keys(response)) {
        const storageType = parseInt(key) as TagVariableStorageTypes;
        switch (storageType) {
          case TagVariableStorageTypes.CHANNEL: {
            Object.assign(storage.channel, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GUILD: {
            Object.assign(storage.server, response[storageType]);
          }; break;
          case TagVariableStorageTypes.USER: {
            Object.assign(storage.user, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GLOBAL: {
            Object.assign(storage.global, response[storageType]);
          }; break;
        }
      }
    }

    tag.text += JSON.stringify(storage.channel);

    return true;
  },

  [TagFunctions.VARIABLES_GLOBAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {variablesglobal}
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    const storage: {
      channel: Record<string, string>,
      global: Record<string, string>,
      server: Record<string, string>,
      user: Record<string, string>,
    } = {channel: {}, global: {}, server: {}, user: {}};

    if (tagId) {
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await fetchTagVariables(context, tagId, {
        channelId: context.channelId!,
        guildId: context.guildId,
        userId: context.userId,
      });
      for (let key of Object.keys(response)) {
        const storageType = parseInt(key) as TagVariableStorageTypes;
        switch (storageType) {
          case TagVariableStorageTypes.CHANNEL: {
            Object.assign(storage.channel, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GUILD: {
            Object.assign(storage.server, response[storageType]);
          }; break;
          case TagVariableStorageTypes.USER: {
            Object.assign(storage.user, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GLOBAL: {
            Object.assign(storage.global, response[storageType]);
          }; break;
        }
      }
    }

    tag.text += JSON.stringify(storage.global);

    return true;
  },

  [TagFunctions.VARIABLES_SERVER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {variablesserver}

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    const storage: {
      channel: Record<string, string>,
      global: Record<string, string>,
      server: Record<string, string>,
      user: Record<string, string>,
    } = {channel: {}, global: {}, server: {}, user: {}};

    if (tagId) {
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await fetchTagVariables(context, tagId, {
        channelId: context.channelId!,
        guildId: context.guildId,
        userId: context.userId,
      });
      for (let key of Object.keys(response)) {
        const storageType = parseInt(key) as TagVariableStorageTypes;
        switch (storageType) {
          case TagVariableStorageTypes.CHANNEL: {
            Object.assign(storage.channel, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GUILD: {
            Object.assign(storage.server, response[storageType]);
          }; break;
          case TagVariableStorageTypes.USER: {
            Object.assign(storage.user, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GLOBAL: {
            Object.assign(storage.global, response[storageType]);
          }; break;
        }
      }
    }

    tag.text += JSON.stringify(storage.server);

    return true;
  },

  [TagFunctions.VARIABLES_USER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {variablesuser}

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    const storage: {
      channel: Record<string, string>,
      global: Record<string, string>,
      server: Record<string, string>,
      user: Record<string, string>,
    } = {channel: {}, global: {}, server: {}, user: {}};

    if (tagId) {
      // tag storage goes through our api, so it counts like any other request
      increaseNetworkRequests(tag);
      const response = await fetchTagVariables(context, tagId, {
        channelId: context.channelId!,
        guildId: context.guildId,
        userId: context.userId,
      });
      for (let key of Object.keys(response)) {
        const storageType = parseInt(key) as TagVariableStorageTypes;
        switch (storageType) {
          case TagVariableStorageTypes.CHANNEL: {
            Object.assign(storage.channel, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GUILD: {
            Object.assign(storage.server, response[storageType]);
          }; break;
          case TagVariableStorageTypes.USER: {
            Object.assign(storage.user, response[storageType]);
          }; break;
          case TagVariableStorageTypes.GLOBAL: {
            Object.assign(storage.global, response[storageType]);
          }; break;
        }
      }
    }

    tag.text += JSON.stringify(storage.user);

    return true;
  },
});
