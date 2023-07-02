import * as vm from 'vm';

import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { Permissions, MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import * as mathjs from 'mathjs';

import {
  googleContentVisionOCR,
  googleTranslate,
  searchGoogleImages,
  utilitiesCodeRun,
  utilitiesFetchMedia,
  utilitiesFetchText,
  utilitiesImagescriptV1,
} from '../api';
import { RestResponses } from '../api/types';
import { CodeLanguages, GoogleLocales, MAX_MEMBERS_SAFE } from '../constants';

import * as DefaultParameters from './defaultparameters';
import * as Parameters from './parameters';
import {
  bigIntGenerateBetween,
  bigIntMax,
  bigIntMin,
  generateCodeFromLanguage,
  generateCodeStdin,
  getCodeLanguage,
  languageCodeToText,
  randomFromArray,
  randomFromIterator,
} from './tools';


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

export const FILE_SIZE_BUFFER = 10 * 1024; // 10 kb

export const ERROR_TIMEOUT_MESSAGE = 'Script execution timed out after';
export const MAX_ATTACHMENTS = 10;
export const MAX_EMBEDS = 10;
export const MAX_ITERATIONS = 150;
export const MAX_NETWORK_REQUESTS = 10;
export const MAX_TIME_MATH = 25;
export const MAX_TIME_REGEX = 25;
export const MAX_VARIABLE_KEY_LENGTH = 64;
export const MAX_VARIABLE_LENGTH = 4000;
export const MAX_VARIABLES = 100;
export const PRIVATE_VARIABLE_PREFIX = '__';

export const MATH_NON_NUMERIC_REGEX = /[^+\-*\/()0-9.n><&]/g;
export const SCRIPT_REGEX = /\{((?:(?!:)(?:.|\s))*):([\s\S]+)\}/;

export const REGEX_ARGUMENT_SPLITTER = new RegExp(`(?<!\\\\)[${TagSymbols.SPLITTER_ARGUMENT}]`, 'g');
export const REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT = new RegExp(`\\\\\\${TagSymbols.SPLITTER_ARGUMENT}`, 'g');


export enum PrivateVariables {
  ARGS = '__args',
  ARGS_STRING = '__argsString',
  FILE_SIZE = '__fileSize',
  FILES = '__files',
  ITERATIONS_REMAINING = '__iterationsRemaining',
  NETWORK_REQUESTS = '__networkRequests',
  RESULTS = '__results',
  SETTINGS = '__settings',
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
  ARG = 'ARG',
  ARGS = 'ARGS',
  ARGSLEN = 'ARGSLEN',
  ATTACHMENT = 'ATTACHMENT',
  ATTACHMENT_LAST = 'ATTACHMENT_LAST',
  ATTACHMENT_SPOILER = 'ATTACHMENT_SPOILER',
  ATTACHMENT_TEXT = 'ATTACHMENT_TEXT',
  AVATAR = 'AVATAR',
  CHANNEL = 'CHANNEL',
  CHANNEL_ID = 'CHANNEL_ID',
  CHANNEL_MENTION = 'CHANNEL_MENTION',
  CHANNEL_RANDOM = 'CHANNEL_RANDOM',
  CHANNEL_RANDOM_ID = 'CHANNEL_RANDOM_ID',
  CHANNEL_RANDOM_MENTION = 'CHANNEL_RANDOM_MENTION',
  DISCORD = 'DISCORD',
  DOWNLOAD = 'DOWNLOAD',
  EVAL = 'EVAL',
  GUILD = 'GUILD',
  GUILD_COUNT = 'GUILD_COUNT',
  GUILD_ID = 'GUILD_ID',
  HASTEBIN = 'HASTEBIN',
  IMAGE_OCR = 'IMAGE_OCR',
  LOGICAL_DELETE = 'LOGICAL_DELETE',
  LOGICAL_GET = 'LOGICAL_GET',
  LOGICAL_IF = 'LOGICAL_IF',
  LOGICAL_SET = 'LOGICAL_SET',
  MATH = 'MATH',
  MATH_ABS = 'MATH_ABS',
  MATH_COS = 'MATH_COS',
  MATH_E = 'MATH_E',
  MATH_MAX = 'MATH_MAX',
  MATH_MIN = 'MATH_MIN',
  MATH_PI = 'MATH_PI',
  MATH_SILENT = 'MATH_SILENT',
  MATH_SIN = 'MATH_SIN',
  MATH_TAN = 'MATH_TAN',
  MEDIA = 'MEDIA',
  MEDIA_AUDIO = 'MEDIA_AUDIO',
  MEDIA_AUDIO_OR_VIDEO = 'MEDIA_AUDIO_OR_VIDEO',
  MEDIA_IMAGE = 'MEDIA_IMAGE',
  MEDIA_IMAGE_OR_VIDEO = 'MEDIA_IMAGE_OR_VIDEO',
  MEDIA_VIDEO = 'MEDIA_VIDEO',
  MEDIASCRIPT = 'MEDIASCRIPT',
  MEDIASCRIPT_2 = 'MEDIASCRIPT_2',
  MESSAGE_CONTENT = 'MESSAGE_CONTENT',
  MESSAGE_RANDOM_ID = 'MESSAGE_RANDOM_ID',
  MESSAGE_USER_ID = 'MESSAGE_USER_ID',
  NSFW = 'NSFW',
  PREFIX = 'PREFIX',
  REPLY_CONTENT = 'REPLY_CONTENT',
  REPLY_USER_ID = 'REPLY_USER_ID',
  RNG_CHOOSE = 'RNG_CHOOSE',
  RNG_RANGE = 'RNG_RANGE',
  SEARCH_GOOGLE_IMAGES = 'SEARCH_GOOGLE_IMAGES',
  SETTINGS = 'SETTINGS',
  STRING_CODEBLOCK = 'STRING_CODEBLOCK',
  STRING_JSONIFY = 'STRING_JSONIFY',
  STRING_LENGTH = 'STRING_LENGTH',
  STRING_LOWER = 'STRING_LOWER',
  STRING_NEWLINE = 'STRING_NEWLINE',
  STRING_REPEAT = 'STRING_REPEAT',
  STRING_REPLACE = 'STRING_REPLACE',
  STRING_REVERSE = 'STRING_REVERSE',
  STRING_SUB = 'STRING_SUB',
  STRING_TRANSLATE = 'STRING_TRANSLATE',
  STRING_UPPER = 'STRING_UPPER',
  STRING_URL_ENCODE = 'STRING_URL_ENCODE',
  TAG_NAME = 'TAG_NAME',
  USER_DISCRIMINATOR = 'USER_DISCRIMINATOR',
  USER_MENTION = 'USER_MENTION',
  USER_NAME = 'USER_NAME',
  USER_NICK = 'USER_NICK',
  USER_ID = 'USER_ID',
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

  [TagFunctions.ARG]: ['arg'],
  [TagFunctions.ARGS]: ['args'],
  [TagFunctions.ARGSLEN]: ['argslen'],
  [TagFunctions.ATTACHMENT]: ['attachment', 'attach', 'file'],
  [TagFunctions.ATTACHMENT_LAST]: ['last_attachment', 'lastattachment', 'lattachment', 'lattach'],
  [TagFunctions.ATTACHMENT_SPOILER]: ['attachmentspoiler', 'attachspoiler', 'filespoiler'],
  [TagFunctions.ATTACHMENT_TEXT]: ['attachmenttext', 'attachtext', 'filetext'],
  [TagFunctions.AVATAR]: ['avatar'],
  [TagFunctions.CHANNEL]: ['channel'],
  [TagFunctions.CHANNEL_ID]: ['channelid'],
  [TagFunctions.CHANNEL_MENTION]: ['channelmention'],
  [TagFunctions.CHANNEL_RANDOM]: ['randchannel'],
  [TagFunctions.CHANNEL_RANDOM_ID]: ['randchannelid'],
  [TagFunctions.CHANNEL_RANDOM_MENTION]: ['randchannelmention'],
  [TagFunctions.DISCORD]: ['discord'],
  [TagFunctions.DOWNLOAD]: ['download', 'text'],
  [TagFunctions.EVAL]: ['eval'],
  [TagFunctions.GUILD]: ['guild', 'server'],
  [TagFunctions.GUILD_COUNT]: ['guildcount', 'membercount', 'servercount'],
  [TagFunctions.GUILD_ID]: ['guildid', 'serverid', 'sid', 'gid'],
  [TagFunctions.HASTEBIN]: ['hastebin', 'haste'],
  [TagFunctions.IMAGE_OCR]: ['ocr'],
  [TagFunctions.LOGICAL_DELETE]: ['delete'],
  [TagFunctions.LOGICAL_GET]: ['get'],
  [TagFunctions.LOGICAL_IF]: ['if'],
  [TagFunctions.LOGICAL_SET]: ['set'],
  [TagFunctions.MATH]: ['math'],
  [TagFunctions.MATH_ABS]: ['abs'],
  [TagFunctions.MATH_COS]: ['cos'],
  [TagFunctions.MATH_E]: ['e'],
  [TagFunctions.MATH_MAX]: ['max'],
  [TagFunctions.MATH_MIN]: ['min'],
  [TagFunctions.MATH_PI]: ['pi'],
  [TagFunctions.MATH_SILENT]: ['mathsilent'],
  [TagFunctions.MATH_SIN]: ['sin'],
  [TagFunctions.MATH_TAN]: ['tan'],
  [TagFunctions.MEDIA]: ['media'],
  [TagFunctions.MEDIA_AUDIO]: ['audio'],
  [TagFunctions.MEDIA_AUDIO_OR_VIDEO]: ['av'],
  [TagFunctions.MEDIA_IMAGE]: ['image'],
  [TagFunctions.MEDIA_IMAGE_OR_VIDEO]: ['iv'],
  [TagFunctions.MEDIASCRIPT]: ['mediascript', 'mscript', 'imagescript', 'iscript'],
  [TagFunctions.MEDIASCRIPT_2]: ['iscript2', 'mscript2'],
  [TagFunctions.MEDIA_VIDEO]: ['video'],
  [TagFunctions.MESSAGE_CONTENT]: ['messagecontent'],
  [TagFunctions.MESSAGE_RANDOM_ID]: ['randmessageid'],
  [TagFunctions.MESSAGE_USER_ID]: ['messageuserid'],
  [TagFunctions.NSFW]: ['nsfw'],
  [TagFunctions.PREFIX]: ['prefix'],
  [TagFunctions.REPLY_CONTENT]: ['replycontent'],
  [TagFunctions.REPLY_USER_ID]: ['replyuserid'],
  [TagFunctions.RNG_CHOOSE]: ['choose'],
  [TagFunctions.RNG_RANGE]: ['range', 'random', 'rnd'],
  [TagFunctions.SEARCH_GOOGLE_IMAGES]: ['search.google.images', 'search.g.images', 's.g.images'],
  [TagFunctions.SETTINGS]: ['settings'],
  [TagFunctions.STRING_CODEBLOCK]: ['code'],
  [TagFunctions.STRING_JSONIFY]: ['jsonify'],
  [TagFunctions.STRING_LENGTH]: ['len', 'length'],
  [TagFunctions.STRING_LOWER]: ['lower'],
  [TagFunctions.STRING_NEWLINE]: ['newline'],
  [TagFunctions.STRING_REPEAT]: ['repeat'],
  [TagFunctions.STRING_REPLACE]: ['replace', 'replaceregex'],
  [TagFunctions.STRING_REVERSE]: ['reverse'],
  [TagFunctions.STRING_SUB]: ['substring'],
  [TagFunctions.STRING_TRANSLATE]: ['translate'],
  [TagFunctions.STRING_UPPER]: ['upper'],
  [TagFunctions.STRING_URL_ENCODE]: ['url', 'urlencode'],
  [TagFunctions.TAG_NAME]: ['tagname'],
  [TagFunctions.USER_DISCRIMINATOR]: ['discrim'],
  [TagFunctions.USER_MENTION]: ['mention'],
  [TagFunctions.USER_NAME]: ['name', 'user'],
  [TagFunctions.USER_NICK]: ['nick'],
  [TagFunctions.USER_ID]: ['id', 'userid'],
  [TagFunctions.USER_RANDOM]: ['randuser'],
  [TagFunctions.USER_RANDOM_ID]: ['randuserid'],
  [TagFunctions.USER_RANDOM_ONLINE]: ['randonline'],
  [TagFunctions.USER_RANDOM_ONLINE_ID]: ['randonlineid'],
  [TagFunctions.USER_RANDOM_ONLINE_TAG]: ['randonlinetag'],
  [TagFunctions.USER_RANDOM_TAG]: ['randusertag'],
  [TagFunctions.USER_TAG]: ['usertag'],
});


export enum TagSettings {
  MEDIA_IV_FALLBACK = 'MEDIA_IV_FALLBACK',
}


export interface TagVariables {
  [PrivateVariables.ARGS]: Array<string>,
  [PrivateVariables.ARGS_STRING]: string,
  [PrivateVariables.FILE_SIZE]: number,
  [PrivateVariables.ITERATIONS_REMAINING]: number,
  [PrivateVariables.NETWORK_REQUESTS]: number,
  [PrivateVariables.RESULTS]: {
    [TagFunctions.SEARCH_GOOGLE_IMAGES]?: Record<string, RestResponses.SearchGoogleImages>,
  },
  [PrivateVariables.SETTINGS]: {
    [TagSettings.MEDIA_IV_FALLBACK]?: TagFunctions.SEARCH_GOOGLE_IMAGES,
  },
  [key: string]: number | string | Array<string> | Record<string, any>,
}

export interface TagResult {
  context: {
    parser?: mathjs.Parser,
  },
  embeds: Array<Embed>,
  files: Array<{buffer: null | string | Buffer, description?: string, filename: string, spoiler?: boolean, url: string}>,
  text: string,
  variables: TagVariables,
}

export async function parse(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  args: string = '',
  variables: TagVariables = Object.create(null),
): Promise<TagResult> {
  let isFirstParse = true;
  if (PrivateVariables.ITERATIONS_REMAINING in variables) {
    isFirstParse = false;
  } else {
    variables[PrivateVariables.ITERATIONS_REMAINING] = MAX_ITERATIONS;
    variables[PrivateVariables.ARGS_STRING] = args;
    variables[PrivateVariables.ARGS] = Parameters.stringArguments(args);
  }
  if (!(PrivateVariables.NETWORK_REQUESTS in variables)) {
    variables[PrivateVariables.NETWORK_REQUESTS] = 0;
  }
  if (!(PrivateVariables.FILE_SIZE in variables)) {
    variables[PrivateVariables.FILE_SIZE] = 0;
  }
  if (!(PrivateVariables.RESULTS in variables)) {
    variables[PrivateVariables.RESULTS] = {};
  }
  if (!(PrivateVariables.SETTINGS in variables)) {
    variables[PrivateVariables.SETTINGS] = {};
  }
  const tag: TagResult = {context: {}, embeds: [], files: [], text: '', variables};
  tag.variables[PrivateVariables.ITERATIONS_REMAINING]--;

  const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;

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

    if (MAX_NETWORK_REQUESTS <= tag.variables[PrivateVariables.NETWORK_REQUESTS]) {
      throw new Error(`Tag attempted to use too many network requests (Max ${MAX_NETWORK_REQUESTS.toLocaleString()} Requests)`);
    }

    // add network checks
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
          let [scriptName, arg] = parseInnerScript(scriptBuffer);
          if (TagFunctionsToString.IGNORE.includes(scriptName)) {
            tag.text += arg;
          } else if (TagFunctionsToString.NOTE.includes(scriptName)) {
            // do nothing
          } else if (TagFunctionsToString.LOGICAL_IF.includes(scriptName)) {
            // do this separate because we dont want to parse args yet
            const wasValid = await ScriptTags[TagFunctions.LOGICAL_IF](context, arg, tag);
            if (!wasValid) {
              tag.text += scriptBuffer;
            }
          } else if (TagFunctionsToString.RNG_CHOOSE.includes(scriptName)) {
            // do this separate from below because we don't want our args parsed yet
            const wasValid = await ScriptTags[TagFunctions.RNG_CHOOSE](context, arg, tag);
            if (!wasValid) {
              tag.text += scriptBuffer;
            }
          } else if (TagFunctionsToString.STRING_SUB.includes(scriptName)) {
            const wasValid = await ScriptTags[TagFunctions.STRING_SUB](context, arg, tag);
            if (!wasValid) {
              tag.text += scriptBuffer;
            }
          } else {
            // check the other tags now
            const argParsed = await parse(context, arg, '', tag.variables);
            normalizeTagResults(tag, argParsed, false);
            arg = argParsed.text;

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
  }

  tag.text = (tag.text + scriptBuffer);
  if (isFirstParse) {
    tag.text = tag.text.replace(/\u200B/g, '\n');
  }
  return tag;
}


export function split(value: string): Array<string> {
  if (!value.includes(TagSymbols.SPLITTER_ARGUMENT)) {
    return [value];
  }

  let depth = 0;
  let position = 0;
  let text = '';

  const args: Array<string> = [];
  while (position < value.length) {
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


function parseInnerScript(value: string): [string, string] {
  let scriptName: string;
  let arg: string;

  // remove the brackets from both sides of the value
  value = value.slice(1, value.length - 1).trim();

  const firstSplitter = value.indexOf(TagSymbols.SPLITTER_FUNCTION);
  if (firstSplitter === -1) {
    scriptName = value.toLowerCase();
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

  if (MAX_EMBEDS < main.embeds.length + other.embeds.length) {
    throw new Error(`Embeds surpassed max embeds length of ${MAX_EMBEDS}`);
  }
  for (let embed of other.embeds) {
    main.embeds.push(embed);
  }

  if (MAX_ATTACHMENTS < main.files.length + other.files.length) {
    throw new Error(`Attachments surpassed max attachments length of ${MAX_ATTACHMENTS}`);
  }
  for (let file of other.files) {
    main.files.push(file);
  }
}


const ScriptTags = Object.freeze({
  _code: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult, language: CodeLanguages, version?: string | null): Promise<boolean> => {
    // {python:code}
    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    const variables = Object.assign({
      [PrivateVariables.FILES]: tag.files.map((file) => {
        return {description: file.description, filename: file.filename};
      }),
    }, tag.variables);
    if (arg) {
      const { code, urls } = generateCodeFromLanguage(language, arg);
      const { result } = await utilitiesCodeRun(context, {
        code,
        language,
        stdin: generateCodeStdin(context, variables),
        urls: Object.values(urls),
        version: version || undefined,
      });
      if (result.error) {
        throw new Error(result.error);
      } else {
        if (result.files.length) {
          const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
          for (let file of result.files) {
            const { filename, size, value } = file;
            if (filename === 'variables.json') {
              if (MAX_ATTACHMENT_SIZE <= size) {
                continue;
              }
              let variables = {};
              try {
                variables = JSON.parse(Buffer.from(value, 'base64').toString());
              } catch(error) {

              }
              if (typeof(variables) === 'object') {
                for (let key in variables) {
                  if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
                    continue;
                  }

                  if (MAX_VARIABLE_KEY_LENGTH < key.length) {
                    throw new Error(`Variable cannot be more than ${MAX_VARIABLE_KEY_LENGTH} characters`);
                  }

                  if (!(key in tag.variables)) {
                    if (MAX_VARIABLES <= Object.keys(tag.variables).filter((key) => !key.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
                      throw new Error(`Reached max variable amount (Max ${MAX_VARIABLES.toLocaleString()} Variables)`);
                    }
                  }

                  tag.variables[key] = String((variables as any)[key]);
                }
              }
              continue;
            }

            const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
            if (maxFileSize <= currentFileSize + size) {
              throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
            }
            tag.variables[PrivateVariables.FILE_SIZE] += size;

            tag.files.push({
              buffer: Buffer.from(value, 'base64'),
              filename,
              url: '',
            });

            if (MAX_ATTACHMENTS < tag.files.length) {
              throw new Error(`Attachments surpassed max attachments length of ${MAX_ATTACHMENTS}`);
            }
          }
        }

        let isEmbed = false;
        if (result.output.length <= 12000) {
          // just incase its a big content lol
          let object: any = null;
          try {
            object = JSON.parse(result.output);
          } catch(error) {
            
          }

          if (object && typeof(object) === 'object' && Object.keys(object).length <= 2 && (('embed' in object) || ('embeds' in object))) {
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

            if (MAX_EMBEDS < embeds.length) {
              throw new Error(`Embeds surpassed max embeds length of ${MAX_EMBEDS}`);
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

            if (MAX_EMBEDS < tag.embeds.length) {
              throw new Error(`Embeds surpassed max embeds length of ${MAX_EMBEDS}`);
            }
          }
        }

        if (!isEmbed) {
          tag.text += result.output;
        }
      }
    }

    return true;
  },

  [TagFunctions.ARG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {arg} (defaults to the first one)
    // {arg:0}

    const index = parseInt(arg || '0');
    if (isNaN(index)) {
      return false;
    }

    const args = tag.variables[PrivateVariables.ARGS];
    if (index in args) {
      tag.text += args[index];
    }

    return true;
  },

  [TagFunctions.ARGS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {args}

    tag.text += tag.variables[PrivateVariables.ARGS_STRING];
    return true;
  },

  [TagFunctions.ARGSLEN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {argslen}

    tag.text += tag.variables[PrivateVariables.ARGS].length;
    return true;
  },

  [TagFunctions.ATTACHMENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult, spoiler?: boolean): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attach:url|filename|description}
    // {attach:https://google.com/something.png}
    // {attach:https://google.com/something.png|something_lol.png}

    if (MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${MAX_ATTACHMENTS}`);
    }

    let [ urlString, filenameArg, ...descriptionValues ] = split(arg);

    const url = await Parameters.url(urlString.trim(), context);

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
    try {
      const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
      const response = await utilitiesFetchMedia(context, {maxFileSize, url});
      const filename = filenameArg || (response.headers.get('content-disposition') || '').split(';').pop()!.split('filename=').pop()!.slice(1, -1) || 'unknown.lmao';

      let data: Buffer | string = await response.buffer();
      if ((response.headers.get('content-type') || '').startsWith('text/')) {
        data = data.toString();
      }

      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      tag.variables[PrivateVariables.FILE_SIZE] += data.length;

      tag.files.push({
        buffer: data,
        description: (descriptionValues.length) ? descriptionValues.join(TagSymbols.SPLITTER_ARGUMENT) : undefined,
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

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

    if (MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${MAX_ATTACHMENTS}`);
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
      const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;

      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      tag.variables[PrivateVariables.FILE_SIZE] += data.length;

      tag.files.push({buffer: data, filename: `${filename}.${extension}`, spoiler: false, url: ''});
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
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.avatarUrlFormat({size: 1024});
      }
    } else {
      tag.text += context.user.avatarUrlFormat({size: 1024});
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
    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    try {
      const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
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

  [TagFunctions.EVAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {eval:{args}}

    const argParsed = await parse(context, arg, '', tag.variables);
    normalizeTagResults(tag, argParsed);
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

  [TagFunctions.IMAGE_OCR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // ocr an image
    // {ocr:cake}

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    const url = await lastImageUrl(arg.trim(), context);
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

  [TagFunctions.LOGICAL_DELETE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    if (arg.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(`Tried to delete a private variable, cannot start with '${PRIVATE_VARIABLE_PREFIX}'.`);
    }
    if (MAX_VARIABLE_KEY_LENGTH < arg.length) {
      throw new Error(`Variable cannot be more than ${MAX_VARIABLE_KEY_LENGTH} characters`);
    }
    delete tag.variables[arg];

    return true;
  },

  [TagFunctions.LOGICAL_GET]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {get:variable-name}

    const key = arg.trim();
    if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(`Tried to access a private variable, cannot start with '${PRIVATE_VARIABLE_PREFIX}'.`);
    }
    if (MAX_VARIABLE_KEY_LENGTH < key.length) {
      throw new Error(`Variable cannot be more than ${MAX_VARIABLE_KEY_LENGTH} characters`);
    }
    if (key in tag.variables) {
      tag.text += tag.variables[key];
    }
  
    return true;
  },

  [TagFunctions.LOGICAL_IF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {if:statement|comparison|value|then:action|else:action}
    // {if:statement|comparison|value|else:action|then:action}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ value1, comparison, value2, conditional1, conditional2 ] = split(arg);
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
        const argParsed = await parse(context, x, '', tag.variables);
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
      const argParsed = await parse(context, text, '', tag.variables);
      normalizeTagResults(tag, argParsed);
    } else {
      tag.text += text;
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {set:variable|value}
    // {set:channel|123}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    let [ key, ...value ] = split(arg);
    key = key.trim();
    if (key.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(`Tried to set a private variable, cannot start with '${PRIVATE_VARIABLE_PREFIX}'.`);
    }

    if (MAX_VARIABLE_KEY_LENGTH < key.length) {
      throw new Error(`Variable cannot be more than ${MAX_VARIABLE_KEY_LENGTH} characters`);
    }

    if (!(key in tag.variables)) {
      if (MAX_VARIABLES <= Object.keys(tag.variables).filter((key) => !key.startsWith(PRIVATE_VARIABLE_PREFIX)).length) {
        throw new Error(`Reached max variable amount (Max ${MAX_VARIABLES.toLocaleString()} Variables)`);
      }
    }

    tag.variables[key] = value.join(TagSymbols.SPLITTER_ARGUMENT).slice(0, MAX_VARIABLE_LENGTH).trim();

    return true;
  },

  [TagFunctions.MATH]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {math:5+5}

    const equation = arg.trim();

    const parser = tag.context.parser = tag.context.parser || mathjs.parser();
    try {
      tag.text += vm.runInNewContext(
        `parser.evaluate(equation)`,
        {equation, parser},
        {timeout: MAX_TIME_MATH},
      );
    } catch(error) {
      if (error.message.includes(ERROR_TIMEOUT_MESSAGE)) {
        throw new Error('Math equation timed out')
      } else {
        throw new Error(`Math equation errored out (${error.message})`);
      }
    }

    return true;
  },

  [TagFunctions.MATH_SILENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {mathsilent:5+5}

    const text = tag.text;

    await ScriptTags[TagFunctions.MATH](context, arg, tag);

    tag.text = text;

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

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

  [TagFunctions.MEDIA_IMAGE_OR_VIDEO]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get image/video from arg or last image/video
    // {iv}
    // {iv:cake}

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    const url = await lastVideoUrl(arg.trim(), context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.MESSAGE_CONTENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get message content from a message id
    // {messagecontent:MESSAGE_ID}

    const channel = context.channel;
    if (channel) {
      const member = context.member;
      if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
        throw new Error('You cannot view the history of this channel');
      }
      if (!channel.canReadHistory) {
        throw new Error('Bot cannot view the history of this channel');
      }
    } else if (!context.inDm) {
      throw new Error('Bot cannot view the history of this channel');
    }

    const messageId = arg.trim();
    if (context.messages.has(messageId)) {
      const message = context.messages.get(messageId)!;
      if (message.channelId === context.channelId) {
        tag.text += message.content;
      }
    } else {
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
      try {
        const message = await context.rest.fetchMessage(context.channelId!, messageId);
        tag.text += message.content;
      } catch(error) {

      }
    }

    return true;
  },

  [TagFunctions.MESSAGE_RANDOM_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // get a random message id from the past 100 messages in the channel
    // {randmessageid}

    if (!context.channelId) {
      return true;
    }

    const channel = context.channel;
    if (channel) {
      const member = context.member;
      if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
        throw new Error('You cannot view the history of this channel');
      }
      if (!channel.canReadHistory) {
        throw new Error('Bot cannot view the history of this channel');
      }
    } else if (!context.inDm) {
      throw new Error('Bot cannot view the history of this channel');
    }

    // maybe dont show the bot's messages?

    const MAX_LIMIT = 100;

    const messagesFound: Array<Structures.Message> = [];

    let before: string | undefined;
    if (channel) {
      // maybe make this use not the channel object (for dms)?
      for (let message of channel.messages.toArray().reverse()) {
        if (context instanceof Command.Context && message.id === context.messageId) {
          continue;
        }
        if (MAX_LIMIT <= messagesFound.length) {
          break;
        }
        messagesFound.push(message);
        before = message.id;
      }
    }

    if (messagesFound.length < MAX_LIMIT) {
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

      const limit = MAX_LIMIT - messagesFound.length;
      const messages = await context.rest.fetchMessages(context.channelId!, {before, limit});
      for (let message of messages.toArray()) {
        if (limit <= messagesFound.length) {
          break;
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
    // {messageuserid:MESSAGE_ID}

    const channel = context.channel;
    if (channel) {
      const member = context.member;
      if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
        throw new Error('You cannot view the history of this channel');
      }
      if (!channel.canReadHistory) {
        throw new Error('Bot cannot view the history of this channel');
      }
    } else if (!context.inDm) {
      throw new Error('Bot cannot view the history of this channel');
    }

    const messageId = arg.trim();
    if (context.messages.has(messageId)) {
      const message = context.messages.get(messageId)!;
      if (message.channelId === context.channelId) {
        tag.text += message.author.id;
      }
    } else {
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
      try {
        const message = await context.rest.fetchMessage(context.channelId!, messageId);
        tag.text += message.author.id;
      } catch(error) {

      }
    }

    return true;
  },
 
  [TagFunctions.MEDIASCRIPT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // mediascript 1

    if (MAX_ATTACHMENTS <= tag.files.length) {
      throw new Error(`Attachments surpassed max attachments length of ${MAX_ATTACHMENTS}`);
    }

    const code = arg.trim();
    if (!code) {
      return false;
    }

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
    try {
      const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
      const response = await utilitiesImagescriptV1(context, {code});
      const filename = (response.headers.get('content-disposition') || '').split(';').pop()!.split('filename=').pop()!.slice(1, -1) || 'unknown.lmao';

      let data: Buffer | string = await response.buffer();
      if ((response.headers.get('content-type') || '').startsWith('text/')) {
        data = data.toString();
      }

      const currentFileSize = tag.variables[PrivateVariables.FILE_SIZE];
      if (maxFileSize <= currentFileSize + data.length) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
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

  [TagFunctions.MEDIASCRIPT_2]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // MEDIASCRIPT 2

    return false;
  },

  [TagFunctions.NSFW]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // errors the command if the channel/user isnt suppose to use nsfw
    // {nsfw}

    if (DefaultParameters.safe(context)) {
      throw new Error('Cannot use a NSFW tag here!');
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
      const argParsed = await parse(context, value, '', tag.variables);
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
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
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
      case TagSettings.MEDIA_IV_FALLBACK: {
        if (value) {
          value = value.toLowerCase();

          let parsedValue: any = null;
          for (let tagFunction of [TagFunctions.SEARCH_GOOGLE_IMAGES]) {
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
      default: {
        return false;
      };
    }

    return true;
  },

  [TagFunctions.STRING_CODEBLOCK]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {code:text}

    tag.text += Markup.codeblock(arg);
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

    const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
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
        {timeout: MAX_TIME_REGEX},
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
      const parsed = await parse(context, startText, '', tag.variables);
      normalizeTagResults(tag, parsed, false);

      start = parseInt(parsed.text.trim());
      if (isNaN(start)) {
        return false;
      }
    }

    let end: number | undefined;
    if (endText !== undefined) {
      const parsed = await parse(context, endText, '', tag.variables);
      end = parseInt(parsed.text.trim());
      for (let file of parsed.files) {
        tag.files.push(file);
      }
      if (isNaN(end)) {
        return false;
      }
    }

    // parse it
    const argParsed = await parse(context, text, '', tag.variables);
    normalizeTagResults(tag, argParsed, false);

    tag.text += argParsed.text.substring(start, end);

    return true;
  },

  [TagFunctions.STRING_TRANSLATE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // translate some text
    // {translate:cake}
    // {translate:cake|russian}

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

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

  [TagFunctions.TAG_NAME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {tagname}

    if (context.metadata && context.metadata.tag) {
      tag.text += context.metadata.tag.name;
    }

    return true;
  },

  [TagFunctions.USER_DISCRIMINATOR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {discrim}
    // {discrim:user}

    if (arg) {
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.discriminator;
      }
    } else {
      tag.text += context.user.discriminator;
    }
    return true;
  },

  [TagFunctions.USER_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {mention}
    // {mention:user}

    if (arg) {
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
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
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
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
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.name;
      }
    } else {
      tag.text += (context.member) ? context.member.name : context.user.name;
    }
    return true;
  },

  [TagFunctions.USER_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, tag: TagResult): Promise<boolean> => {
    // {id}
    // {id:user}

    if (arg) {
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
      const user = await findMemberOrUser(arg, context);
      if (user) {
        tag.text += user.id;
      }
    } else {
      tag.text += context.user.id;
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
      tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
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
