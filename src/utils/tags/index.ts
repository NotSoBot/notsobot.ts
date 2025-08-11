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

import {
  fetchTagId,
  fetchTagVariable,
  fetchTagVariables,
  deleteTagVariable,
  generateTag,
  googleContentVisionOCR,
  googleTranslate,
  mediaAVToolsExtractAudio,
  mediaAVToolsTranscribe,
  putTagVariable,
  putTagVariables,
  searchDuckDuckGoImages,
  searchGoogleImages,
  searchImgur,
  searchYoutube,
  utilitiesCodeRun,
  utilitiesFetchMedia,
  utilitiesFetchText,
  utilitiesImagescriptV1,
  utilitiesLocations,
  utilitiesMLEdit,
  utilitiesMLImagine,
  utilitiesMLInterrogate,
  utilitiesProxyRequest,
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
  TagVariableStorageTypes,
  YoutubeResultTypes,
  CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND,
  MAX_MEMBERS_SAFE,
} from '../../constants';

import { increaseUsage } from '../formatter/commands/tag.show';

import * as DefaultParameters from '../defaultparameters';
import { MathWorker, MATH_ERROR_TIMEOUT_MESSAGE } from '../math';
import { PageObject } from '../paginator';
import * as Parameters from '../parameters';
import {
  bigIntGenerateBetween,
  bigIntMax,
  bigIntMin,
  checkNSFW,
  generateCodeFromLanguage,
  generateCodeStdin,
  getCodeLanguage,
  getGuildObjectForJSONSerialization,
  isSnowflake,
  isValidAttachmentUrl,
  languageCodeToText,
  randomFromArray,
  randomFromIterator,
  textToBoolean,
} from '../tools';

import { TagExitError, TagRequestError } from './exceptions';

export { TagExitError, TagRequestError };



const findChannel = Parameters.channel({inGuild: true});
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
  MAX_COMPONENT_EXECUTIONS: number,
  MAX_EMBEDS: number,
  MAX_ITERATIONS: number,
  MAX_NETWORK_REQUESTS: number,
  MAX_NETWORK_REQUESTS_ML: number,
  MAX_NETWORK_REQUESTS_OPENAI: number,
  MAX_PAGES: number,
  MAX_STORAGE_GLOBAL_AMOUNT: number,
  MAX_STORAGE_GUILD_AMOUNT: number,
  MAX_STORAGE_CHANNEL_AMOUNT: number,
  MAX_STORAGE_USER_AMOUNT: number,
  MAX_STORAGE_KEY_LENGTH: number,
  MAX_STORAGE_VALUE_LENGTH: number,
  MAX_TAG_EXECUTIONS: number,
  MAX_TIME_REGEX: number,
  MAX_VARIABLE_KEY_LENGTH: number,
  MAX_VARIABLE_LENGTH: number,
  MAX_VARIABLES: number,
}

export const TagLimitDefaults: TagLimits = Object.freeze({
  MAX_AI_EXECUTIONS: 1,
  MAX_API_MANIPULATIONS: 1,
  MAX_ATTACHMENTS: 10,
  MAX_COMPONENT_EXECUTIONS: 2,
  MAX_EMBEDS: 10,
  MAX_ITERATIONS: 450,
  MAX_NETWORK_REQUESTS: 15,
  MAX_NETWORK_REQUESTS_ML: 5,
  MAX_NETWORK_REQUESTS_OPENAI: 2,
  MAX_PAGES: 1000,
  MAX_STORAGE_GLOBAL_AMOUNT: 5,
  MAX_STORAGE_GUILD_AMOUNT: 5,
  MAX_STORAGE_CHANNEL_AMOUNT: 5,
  MAX_STORAGE_USER_AMOUNT: 5,
  MAX_STORAGE_KEY_LENGTH: 128,
  MAX_STORAGE_VALUE_LENGTH: 16384,
  MAX_TAG_EXECUTIONS: 1,
  MAX_TIME_REGEX: 25,
  MAX_VARIABLE_KEY_LENGTH: 64,
  MAX_VARIABLE_LENGTH: 1 * 1024 * 1024,
  MAX_VARIABLES: 100,
});

export const PRIVATE_VARIABLE_PREFIX = '__';

export const ATTACHMENT_URL_REGEX = /(https?:\/\/(?:media\.discordapp\.net|cdn.discordapp.com)\/attachments\/[0-9]*\/[0-9]*\/[A-Za-z0-9_.-]*(?:\?[a-zA-Z0-9&=]*)?)/g;
export const MATH_NON_NUMERIC_REGEX = /[^+\-*\/()0-9.n><&]/g;
export const SCRIPT_REGEX = /\{((?:(?!:)(?:.|\s))*):([\s\S]+)\}/;
export const URL_FILE_REPLACEMENT_REGEX = /FILE_([0-9]+)(_COPY)?/g;

export const REGEX_ARGUMENT_SPLITTER = new RegExp(`(?<!\\\\)[${TagSymbols.SPLITTER_ARGUMENT}]`, 'g');
export const REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT = new RegExp(`\\\\\\${TagSymbols.SPLITTER_ARGUMENT}`, 'g');


export enum PrivateVariables {
  AI_EXECUTIONS = '__aiExecutions',
  API_MANIPULATIONS = '__apiManipulations',
  ARGS = '__args',
  ARGS_STRING = '__argsString',
  COMPONENT_EXECUTIONS = '__componentExecutions',
  FILE_SIZE = '__fileSize',
  FILES = '__files',
  ITERATIONS_REMAINING = '__iterationsRemaining',
  NETWORK_REQUESTS = '__networkRequests',
  NETWORK_REQUESTS_ML = '__networkRequestsML',
  NETWORK_REQUESTS_OPENAI = '__networkRequestsOpenAI',
  RESULTS = '__results',
  SETTINGS = '__settings',
  TAG_EXECUTIONS = '__tagExecutions',
}


export const AllowedDiscordProperties = Object.freeze({
  [Structures.Member.constructor.name]: {
    functions: [],
    variables: ['avatar', 'avatarUrl', 'color', 'colorRole', 'deaf', 'discriminator', 'highestRole', 'hoistedRole', 'id', 'isBoosting', 'isOffline', 'isOwner', 'joinedAt', 'joinedAtUnix', 'mention', 'mute', 'nick', 'name', 'username'],
  },
  [Structures.Role.constructor.name]: {
    functions: [],
    variables: ['botId', 'color', 'createdAt', 'createdAtUnix', 'hoist', 'id', 'integrationId', 'isBoosterRole', 'isDefault', 'managed', 'mention', 'mentionable', 'name', 'permissions', 'position'],
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
  API_SEARCH_DUCKDUCKGO_IMAGES = 'API_SEARCH_DUCKDUCKGO_IMAGES',
  API_SEARCH_IMGUR = 'API_SEARCH_IMGUR',
  API_UTILITIES_LOCATIONS = 'API_UTILITIES_LOCATIONS',
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
  DOWNLOAD = 'DOWNLOAD',
  EMBED_JSON = 'EMBED_JSON',
  EVAL = 'EVAL',
  EVAL_SILENT = 'EVAL_SILENT',
  EXIT = 'EXIT',
  GUILD = 'GUILD',
  GUILD_COUNT = 'GUILD_COUNT',
  GUILD_ID = 'GUILD_ID',
  HASTEBIN = 'HASTEBIN',
  IMAGE_INTERROGATE = 'IMAGE_INTERROGATE',
  IMAGE_OCR = 'IMAGE_OCR',
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
  LOGICAL_GET_GLOBAL = 'LOGICAL_GET_GLOBAL',
  LOGICAL_GET_SERVER = 'LOGICAL_GET_SERVER',
  LOGICAL_GET_USER = 'LOGICAL_GET_USER',
  LOGICAL_IF = 'LOGICAL_IF',
  LOGICAL_IF_ERROR = 'LOGICAL_IF_ERROR',
  LOGICAL_OR = 'LOGICAL_OR',
  LOGICAL_SET = 'LOGICAL_SET',
  LOGICAL_SET_CHANNEL = 'LOGICAL_SET_CHANNEL',
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
  SEARCH_DUCKDUCKGO_IMAGES = 'SEARCH_DUCKDUCKGO_IMAGES',
  SEARCH_GOOGLE_IMAGES = 'SEARCH_GOOGLE_IMAGES',
  SEARCH_YOUTUBE = 'SEARCH_YOUTUBE',
  SETTINGS = 'SETTINGS',
  STRING_INDEX_OF = 'STRING_INDEX_OF',
  STRING_JSONIFY = 'STRING_JSONIFY',
  STRING_LENGTH = 'STRING_LENGTH',
  STRING_LOWER = 'STRING_LOWER',
  STRING_MARKUP_CODEBLOCK = 'STRING_MARKUP_CODEBLOCK',
  STRING_MARKUP_TIME = 'STRING_MARKUP_TIME',
  STRING_NEWLINE = 'STRING_NEWLINE',
  STRING_ONE_OF = 'STRING_ONE_OF',
  STRING_REPEAT = 'STRING_REPEAT',
  STRING_REPLACE = 'STRING_REPLACE',
  STRING_REVERSE = 'STRING_REVERSE',
  STRING_SUB = 'STRING_SUB',
  STRING_TRANSLATE = 'STRING_TRANSLATE',
  STRING_UPPER = 'STRING_UPPER',
  STRING_URL_ENCODE = 'STRING_URL_ENCODE',
  TAG = 'TAG',
  TAG_ID = 'TAG_ID',
  TAG_NAME = 'TAG_NAME',
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
  USER_TAG = 'USER_TAG',
}


export const TagFunctionsToString = Object.freeze({
  IGNORE: ['ignore'],
  NOTE: ['note'],

  [TagFunctions.AI]: ['ai'],
  [TagFunctions.API_CREATE_REMINDER]: ['api.create.reminder'],
  [TagFunctions.API_SEARCH_DUCKDUCKGO_IMAGES]: ['api.search.duckduckgo.images'],
  [TagFunctions.API_SEARCH_IMGUR]: ['api.search.imgur'],
  [TagFunctions.API_UTILITIES_LOCATIONS]: ['api.utilities.locations'],
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
  [TagFunctions.DOWNLOAD]: ['download', 'text'],
  [TagFunctions.EMBED_JSON]: ['embedjson'],
  [TagFunctions.EVAL]: ['eval'],
  [TagFunctions.EVAL_SILENT]: ['evalsilent'],
  [TagFunctions.EXIT]: ['exit'],
  [TagFunctions.GUILD]: ['guild', 'server'],
  [TagFunctions.GUILD_COUNT]: ['guildcount', 'membercount', 'servercount'],
  [TagFunctions.GUILD_ID]: ['guildid', 'serverid', 'sid', 'gid'],
  [TagFunctions.HASTEBIN]: ['hastebin', 'haste'],
  [TagFunctions.IMAGE_INTERROGATE]: ['identify', 'interrogate'],
  [TagFunctions.IMAGE_OCR]: ['ocr'],
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
  [TagFunctions.LOGICAL_GET_GLOBAL]: ['getglobal'],
  [TagFunctions.LOGICAL_GET_SERVER]: ['getserver'],
  [TagFunctions.LOGICAL_GET_USER]: ['getuser'],
  [TagFunctions.LOGICAL_IF]: ['if'],
  [TagFunctions.LOGICAL_IF_ERROR]: ['iferror'],
  [TagFunctions.LOGICAL_OR]: ['or'],
  [TagFunctions.LOGICAL_SET]: ['set'],
  [TagFunctions.LOGICAL_SET_CHANNEL]: ['setchannel'],
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
  [TagFunctions.SEARCH_DUCKDUCKGO_IMAGES]: ['search.duckduckgo.images', 'search.ddg.images', 's.duckduckgo.images', 's.ddg.images'],
  [TagFunctions.SEARCH_GOOGLE_IMAGES]: ['search.google.images', 'search.g.images', 's.google.images', 's.g.images'],
  [TagFunctions.SEARCH_YOUTUBE]: ['search.youtube', 'search.yt', 's.youtube', 's.yt'],
  [TagFunctions.SETTINGS]: ['settings'],
  [TagFunctions.STRING_INDEX_OF]: ['indexof'],
  [TagFunctions.STRING_JSONIFY]: ['jsonify'],
  [TagFunctions.STRING_LENGTH]: ['len', 'length'],
  [TagFunctions.STRING_LOWER]: ['lower'],
  [TagFunctions.STRING_MARKUP_CODEBLOCK]: ['code', 'markupcodeblock'],
  [TagFunctions.STRING_MARKUP_TIME]: ['markuptime'],
  [TagFunctions.STRING_NEWLINE]: ['newline'],
  [TagFunctions.STRING_ONE_OF]: ['oneof'],
  [TagFunctions.STRING_REPEAT]: ['repeat'],
  [TagFunctions.STRING_REPLACE]: ['replace', 'replaceregex'],
  [TagFunctions.STRING_REVERSE]: ['reverse'],
  [TagFunctions.STRING_SUB]: ['substring'],
  [TagFunctions.STRING_TRANSLATE]: ['translate'],
  [TagFunctions.STRING_UPPER]: ['upper'],
  [TagFunctions.STRING_URL_ENCODE]: ['url', 'urlencode'],
  [TagFunctions.TAG]: ['tag'],
  [TagFunctions.TAG_ID]: ['tagid'],
  [TagFunctions.TAG_NAME]: ['tagname'],
  [TagFunctions.TIME_UNIX]: ['unix'],
  [TagFunctions.TIME_UNIX_FROM_SNOWFLAKE]: ['unixsnowflake'],
  [TagFunctions.TIME_UNIX_SECONDS]: ['unixs'],
  [TagFunctions.TRANSCRIBE]: ['transcribe'],
  [TagFunctions.TRAVERSE_JSON]: ['traversejson'],
  [TagFunctions.TYPE]: ['type'],
  [TagFunctions.USER_AVATAR]: ['useravatar'],
  [TagFunctions.USER_DISCRIMINATOR]: ['discrim'],
  [TagFunctions.USER_ID]: ['id', 'userid'],
  [TagFunctions.USER_MENTION]: ['mention'],
  [TagFunctions.USER_NAME]: ['name', 'user'],
  [TagFunctions.USER_NICK]: ['nick'],
  [TagFunctions.USER_RANDOM]: ['randuser'],
  [TagFunctions.USER_RANDOM_ID]: ['randuserid'],
  [TagFunctions.USER_RANDOM_ONLINE]: ['randonline'],
  [TagFunctions.USER_RANDOM_ONLINE_ID]: ['randonlineid'],
  [TagFunctions.USER_RANDOM_ONLINE_TAG]: ['randonlinetag'],
  [TagFunctions.USER_RANDOM_TAG]: ['randusertag'],
  [TagFunctions.USER_TAG]: ['usertag'],
});


export enum TagSettings {
  AI_MODEL = 'AI_MODEL',
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
  [PrivateVariables.ITERATIONS_REMAINING]: number,
  [PrivateVariables.NETWORK_REQUESTS]: number,
  [PrivateVariables.NETWORK_REQUESTS_ML]: number,
  [PrivateVariables.NETWORK_REQUESTS_OPENAI]: number,
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
    [TagSettings.MEDIA_AV_FALLBACK]?: TagFunctions.SEARCH_YOUTUBE,
    [TagSettings.MEDIA_IV_FALLBACK]?: TagFunctions.MEDIA_IMAGE_IMAGINE_URL | TagFunctions.SEARCH_GOOGLE_IMAGES | TagFunctions.SEARCH_YOUTUBE,
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
  variables: TagVariables,
}

export async function parse(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  args: string = '',
  variables: TagVariables = Object.create(null),
  tagContext: TagContext = Object.create(null),
  limits: Partial<TagLimits> = Object.create(null),
  shouldTrim: boolean = true,
): Promise<TagResult> {
  const tagLimits: TagLimits = Object.assign({}, TagLimitDefaults);
  for (let key in limits) {
    if (key in tagLimits) {
      (tagLimits as any)[key] = (limits as any)[key];
    }
  }

  let isFirstParse = true;
  if (PrivateVariables.ITERATIONS_REMAINING in variables) {
    isFirstParse = false;
  } else {
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
  if (!(PrivateVariables.NETWORK_REQUESTS in variables)) {
    (variables as any)[PrivateVariables.NETWORK_REQUESTS] = 0;
  }
  if (!(PrivateVariables.NETWORK_REQUESTS_ML in variables)) {
    (variables as any)[PrivateVariables.NETWORK_REQUESTS_ML] = 0;
  }
  if (!(PrivateVariables.NETWORK_REQUESTS_OPENAI in variables)) {
    (variables as any)[PrivateVariables.NETWORK_REQUESTS_OPENAI] = 0;
  }
  if (!(PrivateVariables.FILE_SIZE in variables)) {
    (variables as any)[PrivateVariables.FILE_SIZE] = 0;
  }
  if (!(PrivateVariables.RESULTS in variables)) {
    (variables as any)[PrivateVariables.RESULTS] = {};
  }
  if (!(PrivateVariables.SETTINGS in variables)) {
    (variables as any)[PrivateVariables.SETTINGS] = {};
  }
  if (!(PrivateVariables.TAG_EXECUTIONS in variables)) {
    (variables as any)[PrivateVariables.TAG_EXECUTIONS] = 0;
  }

  let replacement: string | null = null;
  if (isFirstParse) {
    // go through the text and replace

    const expired = new Set();
    // go through them all and see if they are expired, if so then replace
    for (let match of value.matchAll(ATTACHMENT_URL_REGEX)) {
      const isValid = isValidAttachmentUrl(match[0]);
      if (!isValidAttachmentUrl(match[0])) {
        expired.add(match[0]);
      }
    }

    for (let match of args.matchAll(ATTACHMENT_URL_REGEX)) {
      const isValid = isValidAttachmentUrl(match[0]);
      if (!isValidAttachmentUrl(match[0])) {
        expired.add(match[0]);
      }
    }

    const oldValue = value;
    if (expired.size && expired.size <= 50) {
      const { refreshed_urls: refreshedUrls } = await context.rest.request({
        body: {attachment_urls: Array.from(expired)},
        route: {
          method: 'post',
          path: '/attachments/refresh-urls',
        },
      });
      for (let item of refreshedUrls) {
        value = value.replace(item.original, item.refreshed);
        args = args.replace(item.original, item.refreshed);
      }
      if (oldValue !== value) {
        replacement = value;
      }
      if ((variables as any)[PrivateVariables.ARGS_STRING] !== args) {
        (variables as any)[PrivateVariables.ARGS_STRING] = args;
        (variables as any)[PrivateVariables.ARGS] = Parameters.stringArguments(args);
      }
    }
  }

  const tag: TagResult = {components: null, context: tagContext, embeds: [], files: [], limits: tagLimits, pages: [], replacement, text: '', variables};
  tag.variables[PrivateVariables.ITERATIONS_REMAINING]--;

  const maxFileSize = context.maxAttachmentSize;

  let depth = 0;
  let scriptBuffer = '';
  let position = 0;
  while (position < value.length) {
    if (maxFileSize < tag.text.length) {
      throw new Error(`Text exceeded ${maxFileSize} bytes`);
    }

    if (tag.variables[PrivateVariables.ITERATIONS_REMAINING] <= 0) {
      tag.text += value.slice(position);
      position = value.length;
      continue;
    }

    if (depth === 0) {
      // find next left bracket
      const nextLeftBracket = value.indexOf(TagSymbols.BRACKET_LEFT, position);
      if (nextLeftBracket === -1) {
        tag.text += value.slice(position);
        position = value.length;
        continue;
      }
      tag.text += value.slice(position, nextLeftBracket);
      position = nextLeftBracket;
    }

    increaseAIExecutions(tag, 0);
    increaseAPIManipulations(tag, 0);
    increaseComponentExecutions(tag, 0);
    increaseNetworkRequests(tag, 0);
    increaseNetworkRequestsML(tag, 0);
    increaseNetworkRequestsOpenAI(tag, 0);
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
            } else if (TagFunctionsToString.COMPONENTS_ON_TIMEOUT.includes(scriptName)) {
              const wasValid = await ScriptTags[TagFunctions.COMPONENTS_ON_TIMEOUT](context, arg, tag);
              if (!wasValid) {
                tag.text += scriptBuffer;
              }
            } else {
              // check the other tags now
              const argParsed = await parse(context, arg, '', tag.variables, tag.context, tag.limits);
              normalizeTagResults(tag, argParsed, false);
              if (arg !== argParsed.text) {
                arg = argParsed.text;
                const firstSplitter = scriptBuffer.indexOf(TagSymbols.SPLITTER_FUNCTION);
                if (firstSplitter !== -1) {
                  scriptBuffer = scriptBuffer.slice(0, firstSplitter) + TagSymbols.SPLITTER_FUNCTION + arg + TagSymbols.BRACKET_RIGHT;
                }
              }

              let found = false;
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

              if (!found) {
                // parse as script (check if scriptName is a programming language)
                // do this for now
                const parsed = getCodeLanguage(scriptName);
                if (parsed) {
                  const wasValid = await ScriptTags._code(context, arg, tag, parsed.language, parsed.version);
                  if (!wasValid) {
                    tag.text += scriptBuffer;
                  }
                } else {
                  tag.text += scriptBuffer;
                }
              }
            }

            scriptBuffer = '';
          }
        }; break;
      }
    } catch(error) {
      if (isFirstParse && error instanceof TagExitError) {
        tag.components = null;
        tag.embeds = (tag.embeds.length) ? [] : tag.embeds;
        tag.files = (tag.files.length) ? [] : tag.files;
        tag.pages = (tag.pages.length) ? [] : tag.pages;
        tag.text = error.message || 'Tag Exited';
        scriptBuffer = '';
        break;
      } else {
        throw error;
      }
    }
  }

  tag.text = (tag.text + scriptBuffer);
  if (isFirstParse) {
    tag.text = tag.text.replace(/\u200B/g, '\n');
  }
  return tag;
}


export function increaseAIExecutions(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.AI_EXECUTIONS] += amount;
  }
  if (tag.limits.MAX_TAG_EXECUTIONS < tag.variables[PrivateVariables.AI_EXECUTIONS]) {
    throw new Error(`Tag attempted to use too many AI executions (Max ${tag.limits.MAX_AI_EXECUTIONS.toLocaleString()} Executions)`);
  }
}


export function increaseAPIManipulations(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.API_MANIPULATIONS] += amount;
  }
  if (tag.limits.MAX_API_MANIPULATIONS < tag.variables[PrivateVariables.API_MANIPULATIONS]) {
    throw new Error(`Tag attempted to use too many API Manipulations (Max ${tag.limits.MAX_API_MANIPULATIONS.toLocaleString()} Manipulations)`);
  }
}


export function increaseComponentExecutions(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.COMPONENT_EXECUTIONS] += amount;
  }
  if (tag.limits.MAX_COMPONENT_EXECUTIONS < tag.variables[PrivateVariables.COMPONENT_EXECUTIONS]) {
    throw new Error(`Tag attempted to use too many Component Executions (Max ${tag.limits.MAX_COMPONENT_EXECUTIONS.toLocaleString()} Executions)`);
  }
}


export function increaseNetworkRequests(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.NETWORK_REQUESTS] += amount;
  }
  if (tag.limits.MAX_NETWORK_REQUESTS < tag.variables[PrivateVariables.NETWORK_REQUESTS]) {
    throw new Error(`Tag attempted to use too many network requests (Max ${tag.limits.MAX_NETWORK_REQUESTS.toLocaleString()} Requests)`);
  }
}


export function increaseNetworkRequestsML(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.NETWORK_REQUESTS_ML] += amount;
  }
  if (tag.limits.MAX_NETWORK_REQUESTS_ML < tag.variables[PrivateVariables.NETWORK_REQUESTS_ML]) {
    throw new Error(`Tag attempted to use too many machine learning network requests (Max ${tag.limits.MAX_NETWORK_REQUESTS_ML.toLocaleString()} Requests)`);
  }
}


export function increaseNetworkRequestsOpenAI(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.NETWORK_REQUESTS_OPENAI] += amount;
  }
  if (tag.limits.MAX_NETWORK_REQUESTS_OPENAI < tag.variables[PrivateVariables.NETWORK_REQUESTS_OPENAI]) {
    throw new Error(`Tag attempted to use too many OpenAI network requests (Max ${tag.limits.MAX_NETWORK_REQUESTS_OPENAI.toLocaleString()} Requests)`);
  }
}


export function increaseTagExecutions(tag: TagResult, amount: number = 1) {
  if (amount) {
    tag.variables[PrivateVariables.TAG_EXECUTIONS] += amount;
  }
  if (tag.limits.MAX_TAG_EXECUTIONS < tag.variables[PrivateVariables.TAG_EXECUTIONS]) {
    throw new Error(`Tag attempted to use too many tag executions (Max ${tag.limits.MAX_TAG_EXECUTIONS.toLocaleString()} Executions)`);
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
  (variables as any)[PrivateVariables.NETWORK_REQUESTS_OPENAI] = 0;
  (variables as any)[PrivateVariables.FILE_SIZE] = 0;
  (variables as any)[PrivateVariables.TAG_EXECUTIONS] = 0;
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
        // no script tags found inside, so we have no splitters to ignore
        for (let x of value.slice(position).split(REGEX_ARGUMENT_SPLITTER)) {
          x = x.replace(REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT, TagSymbols.SPLITTER_ARGUMENT);
          args.push(x);
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


function normalizeTagResults(main: TagResult, other: TagResult, content: boolean = true): void {
  if (content) {
    main.text += other.text;
  }

  if (other.components) {
    if (main.components) {
      main.components.components = [...main.components.components, ...other.components.components];
      if (5 <= main.components.components.length) {
        throw new Error('TagScript only supports up to 5 buttons currently');
      }
      if (other.components.onTimeout) {
        main.components.onTimeout = other.components.onTimeout;
      }
    } else {
      main.components = other.components;
    }
  }

  if (main.limits.MAX_EMBEDS < main.embeds.length + other.embeds.length) {
    throw new Error(`Embeds surpassed max embeds length of ${main.limits.MAX_EMBEDS}`);
  }
  for (let embed of other.embeds) {
    main.embeds.push(embed);
  }

  if (main.limits.MAX_ATTACHMENTS < main.files.length + other.files.length) {
    throw new Error(`Attachments surpassed max attachments length of ${main.limits.MAX_ATTACHMENTS}`);
  }
  for (let file of other.files) {
    main.files.push(file);
  }

  if (main.limits.MAX_PAGES < main.pages.length + other.pages.length) {
    throw new Error(`Pages surpassed max page length of ${main.limits.MAX_PAGES}`);
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
      const response = await fetchTagVariables(context, tagId, {
        channelId: context.channelId!,
        guildId: context.guildId,
        userId: context.userId,
      });
      for (let key in Object.keys(response)) {
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

    const files: Array<RequestFile> = [];
    const cache = new Set<number>();
    for (let urlObj of Object.values(urls)) {
      for (let match of urlObj.url.matchAll(URL_FILE_REPLACEMENT_REGEX)) {
        const fileKey = parseInt(match[1]) - 1;
        if (!cache.has(fileKey)) {
          cache.add(fileKey);
          const file = tag.files[fileKey];
          if (!file) {
            throw new Error('Invalid FILE_ Provied');
          }
          if (!file.buffer) {
            urlObj.url = file.url;
            continue;
          }
          files.push({filename: urlObj.filename || file.filename, value: file.buffer});
          if (!match[2]) {
            file.deleted = true;
          }
        }
        urlObj.url = '';
        break;
      }
    }

    for (let i = 0; i < tag.files.length; i++) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    const { result } = await utilitiesCodeRun(context, {
      code,
      files,
      language,
      stdin: generateCodeStdin(context, variables, storage),
      urls: Object.values(urls).filter((x) => x.url),
      version: version || undefined,
    });

    if (result.error && (!result.error.startsWith(CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND) && !result.error.includes('Input'))) {
      throw new Error(result.error);
    }

    if (result.files.length) {
      const maxFileSize = context.maxAttachmentSize;
      for (let file of result.files) {
        const { filename, size, value } = file;
        if (maxFileSize < size) {
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
                  throw new Error(`Variable cannot be more than ${tag.limits.MAX_VARIABLE_KEY_LENGTH} characters`);
                }

                if (!(key in tag.variables)) {
                  if (tag.limits.MAX_VARIABLES <= Object.keys(tag.variables).filter((key) => !key.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
                    throw new Error(`Reached max variable amount (Max ${tag.limits.MAX_VARIABLES.toLocaleString()} Variables)`);
                  }
                }

                tag.variables[key] = String((variables as any)[key]).slice(0, tag.limits.MAX_VARIABLE_LENGTH);
              }
            }

            if (typeof(response.storage) === 'object') {
              const variables = response.storage;
              if (Object.keys(variables).length !== 4) {
                throw new Error('Storage Variables only supports `global`, `server`, `channel`, and `user`');
              }
              if (
                typeof(variables.global) !== 'object' ||
                typeof(variables.server) !== 'object' ||
                typeof(variables.channel) !== 'object' ||
                typeof(variables.user) !== 'object'
              ) {
                throw new Error('Storage Variables only supports `global`, `server`, `channel`, and `user`');
              }
              if (tag.limits.MAX_STORAGE_GLOBAL_AMOUNT < Object.keys(variables.global).length) {
                throw new Error(`Global Variables exceeded max amount (${tag.limits.MAX_STORAGE_GLOBAL_AMOUNT})`);
              }
              if (tag.limits.MAX_STORAGE_GUILD_AMOUNT < Object.keys(variables.server).length) {
                throw new Error(`Server Variables exceeded max amount (${tag.limits.MAX_STORAGE_GUILD_AMOUNT})`);
              }
              if (tag.limits.MAX_STORAGE_CHANNEL_AMOUNT < Object.keys(variables.channel).length) {
                throw new Error(`Channel Variables exceeded max amount (${tag.limits.MAX_STORAGE_CHANNEL_AMOUNT})`);
              }
              if (tag.limits.MAX_STORAGE_USER_AMOUNT < Object.keys(variables.user).length) {
                throw new Error(`User Variables exceeded max amount (${tag.limits.MAX_STORAGE_USER_AMOUNT})`);
              }

              const formattedVariables: Array<{name: string, storageId: string, storageType: TagVariableStorageTypes, value: string}> = [];
              for (let key in variables.global) {
                if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                  throw new Error(`Storage Variable Key cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
                }
                const value = String(variables.global[key]);
                if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                  throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
                }
                formattedVariables.push({
                  name: String(key),
                  storageId: '0',
                  storageType: TagVariableStorageTypes.GLOBAL,
                  value,
                });
              }
              for (let key in variables.server) {
                if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                  throw new Error(`Storage Variable Key cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
                }
                const value = String(variables.server[key]);
                if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                  throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
                }
                formattedVariables.push({
                  name: String(key),
                  storageId: context.guildId || context.channelId!,
                  storageType: TagVariableStorageTypes.GUILD,
                  value,
                });
              }
              for (let key in variables.channel) {
                if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                  throw new Error(`Storage Variable Key cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
                }
                const value = String(variables.channel[key]);
                if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                  throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
                }
                formattedVariables.push({
                  name: String(key),
                  storageId: context.channelId!,
                  storageType: TagVariableStorageTypes.CHANNEL,
                  value,
                });
              }
              for (let key in variables.user) {
                if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
                  throw new Error(`Storage Variable Key cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
                }
                const value = String(variables.user[key]);
                if (tag.limits.MAX_STORAGE_VALUE_LENGTH < value.length) {
                  throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
                }
                formattedVariables.push({
                  name: String(key),
                  storageId: context.userId,
                  storageType: TagVariableStorageTypes.USER,
                  value,
                });
              }

              let hasChange = false;
              if (Object.keys(storage.global).length !== Object.keys(variables.global).length) {
                hasChange = true;
              } else if (Object.keys(storage.server).length !== Object.keys(variables.server).length) {
                hasChange = true;
              } else if (Object.keys(storage.channel).length !== Object.keys(variables.channel).length) {
                hasChange = true;
              } else if (Object.keys(storage.user).length !== Object.keys(variables.user).length) {
                hasChange = true;
              }

              if (!hasChange) {
                for (let item of formattedVariables) {
                  switch (item.storageType) {
                    case TagVariableStorageTypes.CHANNEL: {
                      if (!(item.name in storage.channel) || storage.channel[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                    case TagVariableStorageTypes.GLOBAL: {
                      if (!(item.name in storage.global) || storage.global[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                    case TagVariableStorageTypes.GUILD: {
                      if (!(item.name in storage.server) || storage.server[item.name] !== item.value) {
                        hasChange = true;
                      }
                    }; break;
                    case TagVariableStorageTypes.USER: {
                      if (!(item.name in storage.user) || storage.user[item.name] !== item.value) {
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
          throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
        }

        /*
        const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
        if (maxFileSize <= currentFileSize + size) {
          throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
        }
        */
        tag.variables[PrivateVariables.FILE_SIZE] += size;

        tag.files.push({
          buffer: Buffer.from(value, 'base64'),
          filename,
          url: '',
        });

        if (tag.limits.MAX_ATTACHMENTS < tag.files.length) {
          throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
        }
      }
    }

    let isComponents = false;
    let isEmbed = false;
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
            let content: string | undefined;
            let embeds: Array<Embed> | undefined;
            let filenames: Array<string> | undefined;
            if (typeof(page) !== 'object') {
              throw new Error('Invalid Page Given');
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
                throw new Error('Invalid Page Given');
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
            if (!content && !embeds && !filenames) {
              throw new Error('Invalid Page Given');
            }
            tag.pages.push({content, embeds, filenames});
            if (tag.limits.MAX_PAGES < tag.pages.length) {
              throw new Error(`Pages surpassed max pages length of ${tag.limits.MAX_PAGES}`);
            }
          }
        }
        if ('components' in object && Array.isArray(object.components)) {
          const components: TagResultComponents = {components: []};
          for (let x of object.components) {
            if (typeof(x) !== 'object') {
              continue;
            }
            if (5 <= components.components.length) {
              throw new Error('TagScript only supports up to 5 buttons currently');
            }
            switch (x.type) {
              case MessageComponentTypes.ACTION_ROW: {
                throw new Error('TagScript does not support action rows yet');
              }; break;
              case MessageComponentTypes.BUTTON: {
                const button: Record<string, any> = {
                  style: MessageComponentButtonStyles.PRIMARY,
                  type: MessageComponentTypes.BUTTON,
                };
                if ('style' in x && !isNaN(x.style) && x.style in MessageComponentButtonStyles && x.style !== MessageComponentButtonStyles.PREMIUM) {
                  // todo: add better checks against MessageComponentButtonStyles since rn the enum is {...{value: key}, ...{key: value}}
                  button.style = x.style;
                }
                if ('disabled' in x) {
                  button.disabled = !!x.disabled;
                }
                if ('url' in x && typeof(x.url) === 'string') {
                  button.url = x.url.slice(0, 512);
                  button.style = MessageComponentButtonStyles.LINK;
                } else if ('label' in x && typeof(x.label) === 'string') {
                  button.label = x.label.slice(0, 80);
                  if (button.style === MessageComponentButtonStyles.LINK) {
                    button.style = MessageComponentButtonStyles.PRIMARY;
                  }
                }
                if ('emoji' in x && typeof(x.emoji) === 'object') {
                  // todo: do stuff here
                }
                if ('run' in x && typeof(x.run) === 'string') {
                  button.run = x.run;
                }
                if ((button.label && button.run) || button.url) {
                  components.components.push(button);
                } else {
                  throw new Error('Buttons must contain a url or a label + run');
                }
              }; break;
              default: {
                throw new Error('TagScript does not support this kind of component');
              };
            }
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
            throw new Error(`Embeds surpassed max embeds length of ${tag.limits.MAX_EMBEDS}`);
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
              throw new Error('Invalid Embed Given');
            }
          }

          if (tag.limits.MAX_EMBEDS < tag.embeds.length) {
            throw new Error(`Embeds surpassed max embeds length of ${tag.limits.MAX_EMBEDS}`);
          }
        }
      }

      if (!isComponents && !isEmbed) {
        tag.text += result.output;
      }
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

    const files: Array<RequestFile> = [];
    const cache = new Set<number>();
    for (let urlObj of Object.values(urls)) {
      for (let match of urlObj.url.matchAll(URL_FILE_REPLACEMENT_REGEX)) {
        const fileKey = parseInt(match[1]) - 1;
        if (!cache.has(fileKey)) {
          cache.add(fileKey);
          const file = tag.files[fileKey];
          if (!file) {
            throw new Error('Invalid FILE_ Provied');
          }
          if (!file.buffer) {
            urlObj.url = file.url;
            continue;
          }
          files.push({filename: urlObj.filename || file.filename, value: file.buffer});
          if (!match[2]) {
            file.deleted = true;
          }
        }
        urlObj.url = '';
        break;
      }
    }

    for (let i = 0; i < tag.files.length; i++) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseAIExecutions(tag);
    increaseNetworkRequests(tag);

    const response = await generateTag(context, {
      files,
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.AI_MODEL],
      prompt: prompt,//[prompt, ...promptExtra].join('\n'),
      urls: Object.values(urls).filter(Boolean),
    });

    tag.text += response.text;
    tag.variables[PrivateVariables.RESULTS][TagFunctions.AI] = response;

    return true;
  },

  [TagFunctions.API_CREATE_REMINDER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {api.create.reminder:time} {api.create.reminder:time|text}

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

    /*
    // todo: add a tag id to this
    const reminder = await createReminder(context, {
      channelId: context.channelId,
      content: result.content,
      guildId: context.guildId,
      messageId: (context instanceof Command.Context) ? context.messageId : null,
      timestampEnd: (result.end) ? result.end.getTime() : undefined,
      timestampStart: result.start.getTime(),
    });
    */

    // maybe store it in tag.variables[PrivateVariables][TagFunctions.API_CREATE_REMINDER]

    tag.text += result.start + ' ' + text;

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
    if (!(arg in cachedResults)) {
      increaseNetworkRequests(tag);
    }

    const response = cachedResults[arg] || await utilitiesWeather(context, {
      query: arg,
      units: units,
    });
    if (!(arg in cachedResults)) {
      cachedResults[arg] = response;
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
      if (isNaN(index)) {
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

  [TagFunctions.ATTACHMENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult, spoiler?: boolean): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attach:url|filename|description}
    // {attach:https://google.com/something.png}
    // {attach:https://google.com/something.png|something_lol.png}

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
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
      });
      if (!(url in cachedResults)) {
        cachedResults[url] = response;
      }

      const filename = filenameArg || response.file.filename;

      let data: Buffer | string = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
      if (response.file.metadata.mimetype.startsWith('text/')) {
        data = data.toString();
      }

      if (maxFileSize < data.length) {
        throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
      }

      /*
      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      */
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
      if (isNaN(index)) {
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

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
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
        throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
      }

      /*
      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      */
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
  
    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
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
      const filename = filenameArg || response.file.filename;
      const waveform = response.arguments && response.arguments.waveform;

      const data: Buffer = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
      if (maxFileSize < data.length) {
        throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
      }

      /*
      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      */
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

    let component : any = null;
    try {
      component = JSON.parse(arg);
    } catch(error) {
      throw new Error('Invalid Component Given');
    }

    if (typeof(component) !== 'object') {
      throw new Error('Invalid Component Given');
    }

    const components: TagResultComponents = tag.components || {components: []};
    if (5 <= components.components.length) {
      throw new Error('TagScript only supports up to 5 buttons currently');
    }

    switch (component.type) {
      case MessageComponentTypes.ACTION_ROW: {
        throw new Error('TagScript does not support action rows yet');
      }; break;
      case MessageComponentTypes.BUTTON: {
        const button: Record<string, any> = {
          style: MessageComponentButtonStyles.PRIMARY,
          type: MessageComponentTypes.BUTTON,
        };
        if ('style' in component && !isNaN(component.style) && component.style in MessageComponentButtonStyles && component.style !== MessageComponentButtonStyles.PREMIUM) {
          // todo: add better checks against MessageComponentButtonStyles since rn the enum is {...{value: key}, ...{key: value}}
          button.style = component.style;
        }
        if ('disabled' in component) {
          button.disabled = !!component.disabled;
        }
        if ('url' in component && typeof(component.url) === 'string') {
          button.url = component.url.slice(0, 512);
          button.style = MessageComponentButtonStyles.LINK;
        } else if ('label' in component && typeof(component.label) === 'string') {
          button.label = component.label.slice(0, 80);
          if (button.style === MessageComponentButtonStyles.LINK) {
            button.style = MessageComponentButtonStyles.PRIMARY;
          }
        }
        if ('emoji' in component && typeof(component.emoji) === 'object') {
          // todo: do stuff here
        }
        if ('run' in component && typeof(component.run) === 'string') {
          button.run = component.run;
        }
        if ((button.label && button.run) || button.url) {
          components.components.push(button);
        } else {
          throw new Error('Buttons must contain a url or a label + run');
        }
      }; break;
      default: {
        throw new Error('TagScript does not support this kind of component');
      };
    }

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

  [TagFunctions.DOWNLOAD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // Actually do it
    // {download:https://google.com}

    const url = await Parameters.url(arg.trim(), context);
    increaseNetworkRequests(tag);

    try {
      const maxFileSize = context.maxAttachmentSize;
      const response = await utilitiesFetchText(context, {maxFileSize, url});

      const text = await response.text();
      if (maxFileSize < text.length + tag.text.length) {
        throw new Error(`Text exceeded ${maxFileSize} bytes`);
      }
      tag.text += text

    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.EMBED_JSON]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {embedjson:{"title": "asd"}}

    try {
      let object = JSON.parse(arg);
      if (typeof(object) !== 'object') {
        throw new Error('Invalid Embed Given');
      }

      const embed = new Embed(object);
      if (!embed.size && (!embed.image || !embed.image.url) && (!embed.thumbnail || !embed.thumbnail.url) && (!embed.video || !embed.video.url)) {
        throw new Error('this error doesn\'t matter');
      }
      tag.embeds.push(embed);
    } catch(error) {
      return false;
    }

    if (tag.limits.MAX_EMBEDS < tag.embeds.length) {
      throw new Error(`Embeds surpassed max embeds length of ${tag.limits.MAX_EMBEDS}`);
    }

    return true;
  },

  [TagFunctions.EVAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {eval:{args}}

    const argParsed = await parse(context, arg, '', tag.variables, tag.context, tag.limits);
    normalizeTagResults(tag, argParsed);
    return true;
  },

  [TagFunctions.EVAL_SILENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {evalsilent:{args}}

    try {
      let argParsed = await parse(context, arg, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, argParsed, false);

      if (argParsed.text) {
        argParsed = await parse(context, argParsed.text, '', tag.variables, tag.context, tag.limits);
        normalizeTagResults(tag, argParsed, false);
      }
    } catch(error) {
      
    }

    return true;
  },

  [TagFunctions.EXIT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {exit:text?}

    throw new TagExitError(arg);

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
          throw new Error('You cannot view the history of this channel');
        }
        if (!channel.canReadHistory) {
          throw new Error('Bot cannot view the history of this channel');
        }
      } else if (!context.inDm && !context.hasServerPermissions) {
        throw new Error('Bot cannot view the history of this channel');
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

      let text: string = '';
      if (conditional.includes(TagSymbols.BRACKET_LEFT)) {
        const argParsed = await parse(context, conditional, '', tag.variables, tag.context, tag.limits);
        normalizeTagResults(tag, argParsed, false);
        text = argParsed.text;
      } else {
        text = conditional;
      }

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

    let values: Array<any>;
    if (text.includes(TagSymbols.BRACKET_LEFT)) {
      const argParsed = await parse(context, text, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, argParsed, false);
      text = argParsed.text;
    }

    if (isNaN(parseInt(text))) {
      try {
        let object = JSON.parse(text);
        if (typeof(object) === 'string') {
          object = Parameters.stringArguments(object);
        }
        if (!Array.isArray(object)) {
          return true;
        }
        values = object;
      } catch(error) {
        return true;
      }
    } else {
      const count = parseInt(text);
      if (200 < count) {
        throw new Error(`Cannot have a for loop that is less than 1 or bigger than 200.`);
      }
      values = Array.from({length: count});
    }

    if (!values.length) {
      return true;
    }

    if (200 < values.length) {
      throw new Error(`Cannot have a for loop that is less than 1 or bigger than 200.`);
    }

    const idx = tag.variables['idx'];
    const valuex = tag.variables['valuex'];
    for (let i = 0; i < values.length; i++) {
      let text: string = '';
      if (code.includes(TagSymbols.BRACKET_LEFT)) {
        tag.variables['idx'] = String(i);
        tag.variables['valuex'] = (typeof(values[i]) === 'object') ? JSON.stringify(values[i]) : String(values[i]);
        const argParsed = await parse(context, code, '', tag.variables, tag.context, tag.limits, false);
        normalizeTagResults(tag, argParsed, false);
        text = argParsed.text;
      } else {
        text = code;
      }
      tag.text += text;
    }
    if (idx === undefined) {
      delete tag.variables['idx'];
    } else {
      tag.variables['idx'] = idx;
    }
    if (valuex === undefined) {
      delete tag.variables['valuex'];
    } else {
      tag.variables['valuex'] = idx;
    }
  
    return true;
  },

  [TagFunctions.LOGICAL_DELETE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    arg = arg.trim();
    if (arg.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(`Tried to delete a private variable, cannot start with '${PRIVATE_VARIABLE_PREFIX}'.`);
    }
    if (tag.limits.MAX_VARIABLE_KEY_LENGTH < arg.length) {
      throw new Error(`Variable cannot be more than ${tag.limits.MAX_VARIABLE_KEY_LENGTH} characters`);
    }
    delete tag.variables[arg];

    return true;
  },

  [TagFunctions.LOGICAL_DELETE_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    arg = arg.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < arg.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.channelId!;
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
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.guildId || context.channelId!;
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
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }
  
    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.userId;
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

    key = key.trim();
    if (tag.limits.MAX_VARIABLE_KEY_LENGTH < key.length) {
      throw new Error(`Variable cannot be more than ${tag.limits.MAX_VARIABLE_KEY_LENGTH} characters`);
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
      if (defaultValue.includes(TagSymbols.BRACKET_LEFT)) {
        const argParsed = await parse(context, defaultValue, '', tag.variables, tag.context, tag.limits);
        normalizeTagResults(tag, argParsed, false);
        tag.text += argParsed.text;
      } else {
        tag.text += defaultValue;
      }
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

    key = key.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      try {
        const storageId = context.channelId!;
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.CHANNEL, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            if (defaultValue.includes(TagSymbols.BRACKET_LEFT)) {
              const argParsed = await parse(context, defaultValue, '', tag.variables, tag.context, tag.limits);
              normalizeTagResults(tag, argParsed, false);
              tag.text += argParsed.text;
            } else {
              tag.text += defaultValue;
            }
          }
        } else {
          throw error;
        }
      }
    }

    return true;
  },

  [TagFunctions.LOGICAL_GET_GLOBAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {getglobal:variable-name}
    // {getglobal:variable-name|DEFAULT VALUE HERE}

    let [ key, defaultValue ] = split(arg, 2);
    if (key === undefined) {
      return false;
    }

    key = key.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      try {
        const storageId = '0';
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.GLOBAL, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            if (defaultValue.includes(TagSymbols.BRACKET_LEFT)) {
              const argParsed = await parse(context, defaultValue, '', tag.variables, tag.context, tag.limits);
              normalizeTagResults(tag, argParsed, false);
              tag.text += argParsed.text;
            } else {
              tag.text += defaultValue;
            }
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

    key = key.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.guildId || context.channelId!;
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.GUILD, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            if (defaultValue.includes(TagSymbols.BRACKET_LEFT)) {
              const argParsed = await parse(context, defaultValue, '', tag.variables, tag.context, tag.limits);
              normalizeTagResults(tag, argParsed, false);
              tag.text += argParsed.text;
            } else {
              tag.text += defaultValue;
            }
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

    key = key.trim();
    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      try {
        const storageId = context.userId;
        const response = await fetchTagVariable(context, tagId, TagVariableStorageTypes.USER, storageId, {
          name: key,
        });
        tag.text += response.value;
      } catch(error) {
        if (error.response && error.response.statusCode === 404) {
          if (defaultValue) {
            if (defaultValue.includes(TagSymbols.BRACKET_LEFT)) {
              const argParsed = await parse(context, defaultValue, '', tag.variables, tag.context, tag.limits);
              normalizeTagResults(tag, argParsed, false);
              tag.text += argParsed.text;
            } else {
              tag.text += defaultValue;
            }
          }
        } else {
          throw error;
        }
      }
    }
  
    return true;
  },

  [TagFunctions.LOGICAL_IF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {if:statement|comparison|value|then:action|else:action}
    // {if:statement|comparison|value|else:action|then:action}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ value1, comparison, value2, conditional1, conditional2 ] = split(arg, 5);
    if (value1 === undefined || comparison === undefined || value2 === undefined || (conditional1 === undefined && conditional2 === undefined)) {
      return false;
    }

    let then = ''
    let elseValue = '';
    if (conditional1 && conditional1.startsWith('then:')) {
      then = conditional1;
      elseValue = conditional2 || elseValue;
    } else if (conditional2 && conditional2.startsWith('then:')) {
      then = conditional2;
      elseValue = conditional1 || elseValue;
    } else {
      return false;
    }

    if (!TAG_IF_COMPARISONS.includes(comparison as TagIfComparisons)) {
      return false;
    }

    const values: [string, string] = [value1, value2];
    for (let i in values) {
      const x = values[i];
      if (x.includes(TagSymbols.BRACKET_LEFT)) {
        // parse it
        const argParsed = await parse(context, x, '', tag.variables, tag.context, tag.limits);
        normalizeTagResults(tag, argParsed, false);
        values[i] = argParsed.text;
      } else {
        values[i] = x;
      }
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
          const [ int1, int2 ] = values.map(BigInt) as [bigint, bigint];
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

    const text = (compared) ? then.slice(5) : (elseValue || '').slice(5);
    if (text.includes(TagSymbols.BRACKET_LEFT)) {
      // parse it
      const argParsed = await parse(context, text, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, argParsed);
    } else {
      tag.text += text;
    }

    return true;
  },

  [TagFunctions.LOGICAL_IF_ERROR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {iferror:action|action}, unlimited actions

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      tag.text += arg;
      return true;
    }

    const conditionals = split(arg);
    for (let conditional of conditionals) {
      let text: string = '';
      if (conditional.includes(TagSymbols.BRACKET_LEFT)) {
        try {
          const argParsed = await parse(context, conditional, '', tag.variables, tag.context, tag.limits);
          normalizeTagResults(tag, argParsed, false);
          text = argParsed.text;
        } catch(error) {
          // go to the next one if it errors
          continue;
        }
      } else {
        text = conditional;
      }

      tag.text += text;
      return true;
    }

    return true;
  },

  [TagFunctions.LOGICAL_OR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {or:action|action}, unlimited actions

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      tag.text += arg;
      return true;
    }

    const conditionals = split(arg);
    for (let conditional of conditionals) {
      let text: string = '';
      if (conditional.includes(TagSymbols.BRACKET_LEFT)) {
        const argParsed = await parse(context, conditional, '', tag.variables, tag.context, tag.limits);
        normalizeTagResults(tag, argParsed, false);
        text = argParsed.text;
      } else {
        text = conditional;
      }
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
    key = key.trim();
    if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(`Tried to set a private variable, cannot start with '${PRIVATE_VARIABLE_PREFIX}'.`);
    }

    if (tag.limits.MAX_VARIABLE_KEY_LENGTH < key.length) {
      throw new Error(`Variable cannot be more than ${tag.limits.MAX_VARIABLE_KEY_LENGTH} characters`);
    }

    if (!(key in tag.variables)) {
      if (tag.limits.MAX_VARIABLES <= Object.keys(tag.variables).filter((key) => !key.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
        throw new Error(`Reached max variable amount (Max ${tag.limits.MAX_VARIABLES.toLocaleString()} Variables)`);
      }
    }

    tag.variables[key] = (value || '').slice(0, tag.limits.MAX_VARIABLE_LENGTH).trim();

    return true;
  },

  [TagFunctions.LOGICAL_SET_CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setchannel:variable|value}
    // {setchannel:lastused|{userid}}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, ...value ] = split(arg);
    key = key.trim();

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    const storageValue = value.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      const storageId = context.channelId!;
      const response = await putTagVariable(context, tagId, TagVariableStorageTypes.CHANNEL, storageId, {
        name: key,
        value: storageValue,
      });
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET_GLOBAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {setglobal:variable|value}
    // {setglobal:lastused|{userid}}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, ...value ] = split(arg);
    key = key.trim();

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    const storageValue = value.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }

    if (tagId) {
      const storageId = '0';
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

    let [ key, ...value ] = split(arg);
    key = key.trim();

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    const storageValue = value.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      const storageId = context.guildId || context.channelId!;
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

    let [ key, ...value ] = split(arg);
    key = key.trim();

    if (tag.limits.MAX_STORAGE_KEY_LENGTH < key.length) {
      throw new Error(`Storage Variable cannot be more than ${tag.limits.MAX_STORAGE_KEY_LENGTH} characters`);
    }

    const storageValue = value.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    if (tag.limits.MAX_STORAGE_VALUE_LENGTH < storageValue.length) {
      throw new Error(`Storage Variable Value cannot be more than ${tag.limits.MAX_STORAGE_VALUE_LENGTH} characters`);
    }

    let tagId: string | null = null;
    if (context.metadata && context.metadata.tag) {
      tagId = (context.metadata.tag.reference_tag) ? context.metadata.tag.reference_tag.id : context.metadata.tag.id;
    }
  
    if (tagId) {
      const storageId = context.userId;
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
      tag.text += await mathWorker.evaluate(equation);
    } catch(error) {
      if (error.message.includes(MATH_ERROR_TIMEOUT_MESSAGE)) {
        throw new Error('Math equation timed out')
      } else {
        throw new Error(`Math equation errored out (${error.message})`);
      }
    }

    return true;
  },

  [TagFunctions.MATH_ABS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {abs:integer}

    const value = parseInt(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.abs(value);

    return true;
  },

  [TagFunctions.MATH_COS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {cos:integer}

    const value = parseInt(arg);
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

    const numbers = split(arg).map((x) => x.split('.').shift()!);
    if (numbers.some((x) => isNaN(x as any))) {
      return false;
    }

    let value: bigint;
    if (numbers.length === 1) {
      value = BigInt(numbers[0]);
    } else {
      value = bigIntMax(...numbers.map(BigInt));
    }
    tag.text += value;

    return true;
  },

  [TagFunctions.MATH_MIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {min:number|number|...}

    if (!arg) {
      return false;
    }

    const numbers = split(arg).map((x) => x.split('.').shift()!);
    if (numbers.some((x) => isNaN(x as any))) {
      return false;
    }

    let value: bigint;
    if (numbers.length === 1) {
      value = BigInt(numbers[0]);
    } else {
      value = bigIntMin(...numbers.map(BigInt));
    }
    tag.text += value;

    return true;
  },

  [TagFunctions.MATH_PI]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {pi}

    tag.text += Math.PI;
    return true;
  },

  [TagFunctions.MATH_SIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {sin:number}

    const value = parseInt(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.sin(value);

    return true;
  },

  [TagFunctions.MATH_TAN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tan:number}

    const value = parseInt(arg);
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

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
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

    const response = await utilitiesMLEdit(context, {
      query: prompt,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: DefaultParameters.safe(context), url},
    );
    const filename = response.file.filename;

    const data = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
    if (maxFileSize < data.length) {
      throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
    }

    /*
    const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
    if (maxFileSize <= currentFileSize + data.length) {
      throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
    }
    */
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

    const response = await utilitiesMLEdit(context, {
      query: prompt,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: DefaultParameters.safe(context),
      upload: true,
      url,
    });
    if (response.storage) {
      tag.text += response.storage.urls.cdn;
    }

    return true;
  },

  [TagFunctions.MEDIA_IMAGE_IMAGINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // imagine an image based off a prompt, empty will auto generate one
    // {imagine}
    // {imagine:cake}

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
    }

    increaseNetworkRequests(tag);
    increaseNetworkRequestsML(tag);

    const maxFileSize = context.maxAttachmentSize;

    const response = await utilitiesMLImagine(context, {
      query: arg,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: DefaultParameters.safe(context),
    });
    const filename = response.file.filename;

    const data = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
    if (maxFileSize < data.length) {
      throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
    }

    /*
    const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
    if (maxFileSize <= currentFileSize + data.length) {
      throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
    }
    */
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

    const response = await utilitiesMLImagine(context, {
      query: arg,
      doNotError: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_DO_NOT_ERROR],
      model: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      safe: DefaultParameters.safe(context),
      upload: true,
    });
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
          throw new Error('You cannot view the history of this channel');
        }
        if (!channel.canReadHistory) {
          throw new Error('Bot cannot view the history of this channel');
        }
      } else if (!context.inDm && !context.hasServerPermissions) {
        throw new Error('Bot cannot view the history of this channel');
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
      throw new Error('Message index cannot be over 99');
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
        throw new Error('You cannot view the history of this channel');
      }
      if (!channel.canReadHistory) {
        throw new Error('Bot cannot view the history of this channel');
      }
    } else if (!context.inDm && !context.hasServerPermissions) {
      throw new Error('Bot cannot view the history of this channel');
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
        if (limit <= messagesFound.length) {
          break;
        }
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          continue;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    if (index === -1) {
      const message = randomFromArray(messagesFound);
      tag.text += message.id;
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
        throw new Error('You cannot view the history of this channel');
      }
      if (!channel.canReadHistory) {
        throw new Error('Bot cannot view the history of this channel');
      }
    } else if (!context.inDm && !context.hasServerPermissions) {
      throw new Error('Bot cannot view the history of this channel');
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
        if (limit <= messagesFound.length) {
          break;
        }
        if (message.interaction && message.hasFlagEphemeral && message.interaction.user.id !== context.userId) {
          continue;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    const message = randomFromArray(messagesFound);
    tag.text += message.id;

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
          throw new Error('You cannot view the history of this channel');
        }
        if (!channel.canReadHistory) {
          throw new Error('Bot cannot view the history of this channel');
        }
      } else if (!context.inDm && !context.hasServerPermissions) {
        throw new Error('Bot cannot view the history of this channel');
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

    if (tag.limits.MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${tag.limits.MAX_ATTACHMENTS}`);
    }

    let code = arg.trim();
    if (!code) {
      return false;
    }

    const files: Array<RequestFile> = [];
    const keyCache: Record<string, string> = {};
    code = code.replace(URL_FILE_REPLACEMENT_REGEX, (match, group1, group2, offset) => {
      if (!(group1 in keyCache)) {
        keyCache[group1] = `FILE_${files.length + 1}`;

        const file = tag.files[parseInt(group1) - 1];
        if (!file) {
          throw new Error('Invalid FILE_ Provided');
        }
        if (!file.buffer) {
          return file.url;
        }

        files.push({filename: file.filename, value: file.buffer});
        if (!group2) {
          // kill it from tag.files
          file.deleted = true;
        }
      }
      return keyCache[group1];
    });

    for (let i = 0; i < tag.files.length; i++) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseNetworkRequests(tag);

    try {
      const maxFileSize = context.maxAttachmentSize;
      const response = await utilitiesImagescriptV1(context, {
        code,
        files,
        mlDiffusionModel: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
      });
      const filename = response.file.filename;

      let data: Buffer | string = (response.file.value) ? Buffer.from(response.file.value, 'base64') : Buffer.alloc(0);
      if (response.file.metadata.mimetype.startsWith('text/')) {
        data = data.toString();
      }

      if (maxFileSize < data.length) {
        throw new Error(`Attachment surpassed max file size of ${maxFileSize} bytes`);
      }

      if (response.arguments) {
        for (let key in response.arguments) {
          await ScriptTags[TagFunctions.LOGICAL_SET](context, [key, response.arguments[key]].join(TagSymbols.SPLITTER_ARGUMENT), tag);
        }
      }

      /*
      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      */
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
        keyCache[group1] = `FILE_${files.length + 1}`;
    
        const file = tag.files[parseInt(group1) - 1];
        if (!file) {
          throw new Error('Invalid FILE_ Provided');
        }
        if (!file.buffer) {
          return file.url;
        }
    
        files.push({filename: file.filename, value: file.buffer});
        if (!group2) {
          // kill it from tag.files
          file.deleted = true;
        }
      }
      return keyCache[group1];
    });

    for (let i = 0; i < tag.files.length; i++) {
      if (tag.files[i].deleted) {
        tag.files.splice(i, 1);
      }
    }

    increaseNetworkRequests(tag);

    try {
      const response = await utilitiesImagescriptV1(context, {
        code,
        files,
        mlDiffusionModel: tag.variables[PrivateVariables.SETTINGS][TagSettings.ML_IMAGINE_MODEL],
        upload: true,
      });

      if (response.storage) {
        tag.text += response.storage.urls.cdn;
      }

      if (response.arguments) {
        for (let key in response.arguments) {
          await ScriptTags[TagFunctions.LOGICAL_SET](context, [key, response.arguments[key]].join(TagSymbols.SPLITTER_ARGUMENT), tag);
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
      throw new Error('Cannot use a NSFW tag here!');
    }

    return true;
  },

  [TagFunctions.NSFW_FILTER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // returns an empty string if the content is deemed NSFW, will cut to 2000 characters
    // {nsfwfilter:text}

    increaseNetworkRequests(tag);
    increaseNetworkRequestsOpenAI(tag);

    if (arg) {
      const [ isAwfulNSFW ] = await checkNSFW(context, arg.slice(0, 2000));
      if (!isAwfulNSFW) {
        tag.text += arg.slice(0, 2000);
      }
    }
  
    return true;
  },

  [TagFunctions.PAGE_JSON]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {pagejson:{"embed": {"title": "asd"}}}

    let page: any = null;
    try {
      page = JSON.parse(arg);
    } catch(error) {
      throw new Error('Invalid Page Given');
    }

    let content: string | undefined;
    let embeds: Array<Embed> | undefined;
    let filenames: Array<string> | undefined;
    if (typeof(page) !== 'object') {
      throw new Error('Invalid Page Given');
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
        throw new Error('Invalid Page Given');
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
    if (!content && !embeds && !filenames) {
      throw new Error('Invalid Page Given');
    }
    tag.pages.push({content, embeds, filenames});

    if (tag.limits.MAX_PAGES < tag.pages.length) {
      throw new Error(`Pages surpassed max pages length of ${tag.limits.MAX_PAGES}`);
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
          // support multipart in 'data'
          // support {files: {key: filename}}
          if ('json' in object) {
            if (typeof(object.json) !== 'object') {
              throw new TagRequestError('Request json is invalid. (allowed: Object, Array)');
            }
            options.dataJSON = object.json;
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
      throw new Error('Request options failed to parse.');
    }

    try {
      const response = await utilitiesProxyRequest(context, options);
      tag.text += JSON.stringify(response);
    } catch(error) {
      if (error.response) {
        try {
          const information = await error.response.json() as any;
          if ('errors' in information) {
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
              throw new Error(`Requested Failed: ${description.join('\n')}`);
            }
          }
          if ('message' in information) {
            throw new Error(information.message);
          }
        } catch(error) {
          
        }
      }
      throw new Error('Request Failed');
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

    if (value.includes(TagSymbols.BRACKET_LEFT)) {
      // parse it
      const argParsed = await parse(context, value, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, argParsed);
    } else {
      tag.text += value;
    }

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
    page = Math.min(page, results.length);
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

    page = Math.min(page, results.length);
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

    const parts = split(arg);
    if (parts.length !== 2) {
      return false;
    }

    let [ settingValue, value ] = parts;

    const setting = settingValue.toUpperCase() as TagSettings;
    if (!(setting in TagSettings)) {
      return false;
    }

    switch (setting) {
      case TagSettings.AI_MODEL: {
        if (value) {
          // todo: set the ai model
        } else {
          delete tag.variables[setting];
        }
      }; break;
      case TagSettings.MEDIA_AV_FALLBACK: {
        if (value) {
          value = value.toLowerCase();

          let parsedValue: any = null;
          for (let tagFunction of [TagFunctions.SEARCH_YOUTUBE]) {
            if (TagFunctionsToString[tagFunction].includes(value)) {
              parsedValue = tagFunction;
              break;
            }
          }

          if (parsedValue) {
            tag.variables[PrivateVariables.SETTINGS][setting] = parsedValue;
          }
        } else {
          delete tag.variables[setting];
        }
      }; break;
      case TagSettings.MEDIA_IV_FALLBACK: {
        if (value) {
          value = value.toLowerCase();

          let parsedValue: any = null;
          for (let tagFunction of [TagFunctions.MEDIA_IMAGE_IMAGINE, TagFunctions.SEARCH_DUCKDUCKGO_IMAGES, TagFunctions.SEARCH_GOOGLE_IMAGES]) {
            if (TagFunctionsToString[tagFunction].includes(value)) {
              parsedValue = tagFunction;
              break;
            }
          }

          if (parsedValue) {
            tag.variables[PrivateVariables.SETTINGS][setting] = parsedValue;
          }
        } else {
          delete tag.variables[setting];
        }
      }; break;
      case TagSettings.ML_IMAGINE_DO_NOT_ERROR: {
        if (value) {
          tag.variables[PrivateVariables.SETTINGS][setting] = textToBoolean(value);
        } else {
          delete tag.variables[setting];
        }
      }; break;
      case TagSettings.ML_IMAGINE_MODEL: {
        if (value) {
          value = value.toUpperCase();
          if (value in MLDiffusionModels) {
            tag.variables[PrivateVariables.SETTINGS][setting] = value as MLDiffusionModels;
          } else {
            throw new Error(`ML Imagine Model must be one of: (${Object.values(MLDiffusionModels)})`);
          }
        } else {
          delete tag.variables[setting];
        }
      }; break;
      default: {
        return false;
      };
    }

    return true;
  },

  [TagFunctions.STRING_INDEX_OF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {indexof:string|text}
    // {indexof:,|the cat jumped, over a dog}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ string, ...textParts ] = split(arg);
    let text: string = textParts.join(TagSymbols.SPLITTER_ARGUMENT);

    {
      const parsed = await parse(context, string, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, parsed, false);
      string = parsed.text.trim();
    }

    {
      const parsed = await parse(context, text, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, parsed, false);
      text = parsed.text.trim();
    }

    tag.text += text.indexOf(string);

    return true;
  },

  [TagFunctions.STRING_JSONIFY]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {jsonify:text}

    tag.text += JSON.stringify(arg);
    return true;
  },

  [TagFunctions.STRING_NEWLINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {newline}
    // {newline:5} (5 newlines)

    if (arg) {
      const amount = parseInt(arg);
      if (isNaN(amount)) {
        return false;
      }
      tag.text += '\u200b'.repeat(amount);
    } else {
      tag.text += '\u200b';
    }

    return true;
  },

  [TagFunctions.STRING_ONE_OF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {oneof:value|choice|choice2|...}
  
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

  [TagFunctions.STRING_MARKUP_CODEBLOCK]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markupcodeblock:text}
  
    tag.text += Markup.codeblock(arg);
    return true;
  },

  [TagFunctions.STRING_MARKUP_TIME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {markuptime:text?|format?}

    let format: MarkupTimestampStyles | undefined;
    let timestamp: string = '';
    if (arg.length) {
      if (arg in MarkupTimestampStyles) {
        // do it
      } else if (arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
        const parts = split(arg);

        const suspectedFormat = parts.pop()!;
        if (suspectedFormat in MarkupTimestampStyles) {
          
        } else {
          parts.push(suspectedFormat);
        }
        timestamp = parts.join(TagSymbols.SPLITTER_ARGUMENT).trim();
      } else {
        timestamp = arg;
      }
    } else {
      timestamp = String(Date.now());
    }

    if (format && format.length !== 1) {
      format = (MarkupTimestampStyles as any)[format] as MarkupTimestampStyles;
    }

    tag.text += Markup.timestamp(timestamp, format);
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

    const maxFileSize = context.maxAttachmentSize;
    if (maxFileSize < (text.length * amount) + tag.text.length) {
      throw new Error(`Text exceeded ${maxFileSize} bytes`);
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

    try {
      tag.text += vm.runInNewContext(
        `source.replace(new RegExp(regex, 'gi'), replaceWith);`,
        {
          regex: regex.trim(),
          source,
          replaceWith,
        },
        {timeout: tag.limits.MAX_TIME_REGEX},
      );
    } catch {
      throw new Error('text replacing errored or timed out');
    }

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

    const [ text, startText, endText ] = split(arg);
    if (text === undefined || startText === undefined) {
      return false;
    }

    let start: number;
    {
      const parsed = await parse(context, startText, '', tag.variables, tag.context, tag.limits);
      normalizeTagResults(tag, parsed, false);

      start = parseInt(parsed.text.trim());
      if (isNaN(start)) {
        return false;
      }
    }

    let end: number | undefined;
    if (endText !== undefined) {
      const parsed = await parse(context, endText, '', tag.variables, tag.context, tag.limits);
      end = parseInt(parsed.text.trim());
      for (let file of parsed.files) {
        tag.files.push(file);
      }
      if (isNaN(end)) {
        return false;
      }
    }

    // parse it
    const argParsed = await parse(context, text, '', tag.variables, tag.context, tag.limits);
    normalizeTagResults(tag, argParsed, false);

    tag.text += argParsed.text.trim().substring(start, end);

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
      throw new Error('Invalid Tag Id');
    }

    if (!tag.variables[PrivateVariables.COMPONENT_EXECUTIONS] && context.metadata && context.metadata.tag && context.metadata.tag.id === tagId) {
      throw new Error('Tag attempted to call itself');
    }

    increaseTagExecutions(tag);
    increaseNetworkRequests(tag);

    try {
      const fetchedTag = await fetchTagId(context, tagId);

      let isAllowed = (fetchedTag.server_id === (context.guildId || context.channelId));
      if (!isAllowed && (context.metadata && context.metadata.tag)) {
        // see if it's from the current tag owner's dms
        const user = await UserStore.getOrFetch(context, context.metadata.tag.user.id);
        if (user) {
          isAllowed = (fetchedTag.server_id === user.channelId);
        }
      }
      if (!isAllowed) {
        // check to see if its a public directory tag
      }

      if (!isAllowed) {
        throw new Error('Cannot call this tag');
        return false;
      }

      await increaseUsage(context, fetchedTag);

      const oldTag = context.metadata && context.metadata.tag;
      try {
        const oldVariables = Object.assign({}, tag.variables);
        const variables = Object.create(null);
        for (let key in PrivateVariables) {
          variables[key] = tag.variables[key];
        }
        variables[PrivateVariables.ARGS_STRING] = tagArguments;
        variables[PrivateVariables.ARGS] = Parameters.stringArguments(tagArguments);

        if (context.metadata) {
          context.metadata.tag = fetchedTag;
        }

        const tagContent = (fetchedTag.reference_tag) ? fetchedTag.reference_tag.content : fetchedTag.content;
        const argParsed = await parse(context, tagContent, tagArguments, variables, tag.context, tag.limits);
        normalizeTagResults(tag, argParsed);
  
        for (let key in PrivateVariables) {
          tag.variables[key] = variables[key];
        }
        tag.variables[PrivateVariables.ARGS_STRING] = oldVariables[PrivateVariables.ARGS_STRING];
        tag.variables[PrivateVariables.ARGS] = oldVariables[PrivateVariables.ARGS];
      } catch(error) {
        return false;
      }
      if (context.metadata) {
        context.metadata.tag = oldTag;
      }
    } catch(error) {
      throw error;
      return false;
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
      const result = path.split(/[\.\[\]]+/).filter(Boolean).reduce((current, key) => {
        return current?.[key];
      }, object);
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
      const member = randomFromArray<Structures.Member>(context.guild.members.filter((member) => !!member.presence));
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
      const member = randomFromArray<Structures.Member>(context.guild.members.filter((member) => !!member.presence));
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
      const member = randomFromArray<Structures.Member>(context.guild.members.filter((member) => !!member.presence));
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
});
