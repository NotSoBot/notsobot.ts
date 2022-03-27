import { runInNewContext } from 'vm';

import { Command, Interaction, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { utilitiesCodeRun, utilitiesFetchMedia, utilitiesFetchText, utilitiesImagescriptV1 } from '../api';
import { CodeLanguages } from '../constants';

import * as DefaultParameters from './defaultparameters';
import * as Parameters from './parameters';
import {
  bigIntGenerateBetween,
  bigIntMax,
  bigIntMin,
  getCodeLanguage,
  randomFromArray,
  randomFromIterator,
} from './tools';


const findChannel = Parameters.channel({inGuild: true});
const findMemberOrUser = Parameters.memberOrUser();


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

export const MAX_ITERATIONS = 150;
export const MAX_NETWORK_REQUESTS = 10;
export const MAX_REGEX_TIME = 25;
export const MAX_REPEAT_AMOUNT = 4000;
export const MAX_STRING_LENGTH = 10000;
export const MAX_VARIABLE_KEY_LENGTH = 64;
export const MAX_VARIABLE_LENGTH = 4000;
export const MAX_VARIABLES = 100;
export const PRIVATE_VARIABLE_PREFIX = '__';

export const SCRIPT_REGEX = /\{((?:(?!:)(?:.|\s))*):([\s\S]+)\}/;

export const REGEX_ARGUMENT_SPLITTER = new RegExp(`(?<!\\\\)[${TagSymbols.SPLITTER_ARGUMENT}]`, 'g');
export const REGEX_ARGUMENT_SPLITTER_ESCAPE_REPLACEMENT = new RegExp(`\\\\\\${TagSymbols.SPLITTER_ARGUMENT}`, 'g');


export enum PrivateVariables {
  FILE_SIZE = '__fileSize',
  ITERATIONS_REMAINING = '__iterationsRemaining',
  NETWORK_REQUESTS = '__networkRequests',
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
  NOT_EQUAL = "!=",
  GREATER_THAN = '>',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN = '<',
  LESS_THAN_OR_EQUAL = '<=',
  TILDE = '~',
}


export const TAG_IF_COMPARISONS = [
  TagIfComparisons.EQUAL,
  TagIfComparisons.NOT_EQUAL,
  TagIfComparisons.GREATER_THAN,
  TagIfComparisons.GREATER_THAN_OR_EQUAL,
  TagIfComparisons.LESS_THAN,
  TagIfComparisons.LESS_THAN_OR_EQUAL,
  TagIfComparisons.TILDE,
];


export enum TagFunctions {
  ARG = 'ARG',
  ARGS = 'ARGS',
  ARGSLEN = 'ARGSLEN',
  ATTACHMENT = 'ATTACHMENT',
  ATTACHMENT_LAST = 'ATTACHMENT_LAST',
  ATTACHMENT_SPOILER = 'ATTACHMENT_SPOILER',
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
  IMAGE = 'IMAGE',
  IMAGESCRIPT = 'IMAGESCRIPT',
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
  MATH_SIN = 'MATH_SIN',
  MATH_TAN = 'MATH_TAN',
  NSFW = 'NSFW',
  PREFIX = 'PREFIX',
  RNG_CHOOSE = 'RNG_CHOOSE',
  RNG_RANGE = 'RNG_RANGE',
  STRING_CODEBLOCK = 'STRING_CODEBLOCK',
  STRING_LENGTH = 'STRING_LENGTH',
  STRING_LOWER = 'STRING_LOWER',
  STRING_NEWLINE = 'STRING_NEWLINE',
  STRING_REPEAT = 'STRING_REPEAT',
  STRING_REPLACE = 'STRING_REPLACE',
  STRING_REVERSE = 'STRING_REVERSE',
  STRING_SUB = 'STRING_SUB',
  STRING_UPPER = 'STRING_UPPER',
  STRING_URL_ENCODE = 'STRING_URL_ENCODE',
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
  [TagFunctions.IMAGE]: ['image', 'iscript'],
  [TagFunctions.IMAGESCRIPT]: ['image2', 'iscript2', 'imagescript'],
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
  [TagFunctions.MATH_SIN]: ['sin'],
  [TagFunctions.MATH_TAN]: ['tan'],
  [TagFunctions.NSFW]: ['nsfw'],
  [TagFunctions.PREFIX]: ['prefix'],
  [TagFunctions.RNG_CHOOSE]: ['choose'],
  [TagFunctions.RNG_RANGE]: ['range', 'random', 'rnd'],
  [TagFunctions.STRING_CODEBLOCK]: ['code'],
  [TagFunctions.STRING_LENGTH]: ['len', 'length'],
  [TagFunctions.STRING_LOWER]: ['lower'],
  [TagFunctions.STRING_NEWLINE]: ['newline'],
  [TagFunctions.STRING_REPEAT]: ['repeat'],
  [TagFunctions.STRING_REPLACE]: ['replace', 'replaceregex'],
  [TagFunctions.STRING_REVERSE]: ['reverse'],
  [TagFunctions.STRING_SUB]: ['substring'],
  [TagFunctions.STRING_UPPER]: ['upper'],
  [TagFunctions.STRING_URL_ENCODE]: ['url', 'urlencode'],
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


export interface TagVariables {
  [PrivateVariables.FILE_SIZE]: number,
  [PrivateVariables.ITERATIONS_REMAINING]: number,
  [PrivateVariables.NETWORK_REQUESTS]: number,
  [key: string]: number | string,
}

export interface TagResult {
  files: Array<{buffer: null | string | Buffer, filename: string, spoiler?: boolean, url: string}>,
  text: string,
  variables: TagVariables,
}

export async function parse(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  args: Array<string>,
  variables: TagVariables = Object.create(null),
): Promise<TagResult> {
  let isFirstParse = true;
  if (PrivateVariables.ITERATIONS_REMAINING in variables) {
    isFirstParse = false;
  } else {
    variables[PrivateVariables.ITERATIONS_REMAINING] = MAX_ITERATIONS;
  }
  if (!(PrivateVariables.NETWORK_REQUESTS in variables)) {
    variables[PrivateVariables.NETWORK_REQUESTS] = 0;
  }
  if (!(PrivateVariables.FILE_SIZE in variables)) {
    variables[PrivateVariables.FILE_SIZE] = 0;
  }
  const tag: TagResult = {files: [], text: '', variables};
  tag.variables[PrivateVariables.ITERATIONS_REMAINING]--;

  let depth = 0;
  let scriptBuffer = '';
  let position = 0;
  while (position < value.length) {
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
            const wasValid = await ScriptTags[TagFunctions.LOGICAL_IF](context, arg, args, tag);
            if (!wasValid) {
              tag.text += scriptBuffer;
            }
          } else if (TagFunctionsToString.RNG_CHOOSE.includes(scriptName)) {
            // do this separate from below because we don't want our args parsed yet
            const wasValid = await ScriptTags[TagFunctions.RNG_CHOOSE](context, arg, args, tag);
            if (!wasValid) {
              tag.text += scriptBuffer;
            }
          } else if (TagFunctionsToString.STRING_SUB.includes(scriptName)) {
            const wasValid = await ScriptTags[TagFunctions.STRING_SUB](context, arg, args, tag);
            if (!wasValid) {
              tag.text += scriptBuffer;
            }
          } else {
            // check the other tags now
            const argParsed = await parse(context, arg, args, tag.variables);
            arg = argParsed.text;
            for (let file of argParsed.files) {
              tag.files.push(file);
            }

            let found = false;
            for (let TAG_FUNCTION of Object.values(TagFunctions)) {
              if (TagFunctionsToString[TAG_FUNCTION].includes(scriptName)) {
                found = true;
                const wasValid = await ScriptTags[TAG_FUNCTION](context, arg, args, tag);
                if (!wasValid) {
                  tag.text += scriptBuffer;
                }
                break;
              }
            }

            if (!found) {
              // parse as script (check if scriptName is a programming language)
              // do this for now
              const language = getCodeLanguage(scriptName);
              if (language) {
                const wasValid = await ScriptTags._code(context, arg, args, tag, language);
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



const ScriptTags = Object.freeze({
  _code: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult, language: CodeLanguages): Promise<boolean> => {
    // {python:code}
    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    if (arg) {
      let guild: any = context.guild;
      if (guild) {
        guild = guild.toJSON();
        guild.members = [];
        guild.presences = [];
        guild.voice_states = [];
      }
      const response = await utilitiesCodeRun(context, {
        code: arg,
        input: JSON.stringify({
          channel: context.channel,
          channel_id: context.channelId,
          guild,
          guild_id: context.guildId,
          member: context.member,
          member_bot: context.me,
          message: (context instanceof Command.Context) ? context.message : null,
          user: context.user,
          user_bot: context.client.user,
          variables: tag.variables,
        }),
        language,
      });
      if (response.error) {
        throw new Error(response.error);
      } else {
        tag.text += response.content;
      }
    }

    return true;
  },

  [TagFunctions.ARG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {arg} (defaults to the first one)
    // {arg:0}

    const index = parseInt(arg || '0');
    if (isNaN(index)) {
      return false;
    }

    if (index in args) {
      tag.text += args[index];
    }

    return true;
  },

  [TagFunctions.ARGS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {args}

    tag.text += args.join(' ');
    return true;
  },

  [TagFunctions.ARGSLEN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {argslen}

    tag.text += args.length;
    return true;
  },

  [TagFunctions.ATTACHMENT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult, spoiler?: boolean): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attach:https://google.com/something.png}

    const url = Parameters.url(arg.trim());

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;
    try {
      const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
      const response = await utilitiesFetchMedia(context, {maxFileSize, url});
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
        spoiler,
        url,
      });
    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.ATTACHMENT_LAST]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // return last image url
    // {lastattachment}

    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    const url = await Parameters.lastImageUrl('', context);
    if (url) {
      tag.text += url;
    }

    return true;
  },

  [TagFunctions.ATTACHMENT_SPOILER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // assume the arg is a url and download it
    // {attachspoiler:https://google.com/something.png}
    return ScriptTags[TagFunctions.ATTACHMENT](context, arg, args, tag, true);
  },

  [TagFunctions.AVATAR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.CHANNEL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.CHANNEL_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.CHANNEL_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.CHANNEL_RANDOM]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.CHANNEL_RANDOM_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.CHANNEL_RANDOM_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.DISCORD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // split it up by `.`, use the first one as context[firstVariable]

    // {discord:member.color}
    // {discord:user.id}
    return false;
  },

  [TagFunctions.DOWNLOAD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // Actually do it
    // {download:https://google.com}

    const url = Parameters.url(arg.trim());
    tag.variables[PrivateVariables.NETWORK_REQUESTS]++;

    try {
      const maxFileSize = (context.guild) ? context.guild.maxAttachmentSize : undefined;
      const response = await utilitiesFetchText(context, {maxFileSize, url});
      tag.text += await response.text();
    } catch(error) {
      console.log(error);
      throw error;
    }

    return true;
  },

  [TagFunctions.EVAL]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {eval:{args}}

    const argParsed = await parse(context, arg, args, tag.variables);
    tag.text += argParsed.text;
    for (let file of argParsed.files) {
      tag.files.push(file);
    }
    return true;
  },

  [TagFunctions.GUILD]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {guild}
    // todo: {guild:178313653177548800}

    if (context.guild) {
      tag.text += context.guild.name;
    } else {
      tag.text += 'Direct Message';
    }
    return true;
  },

  [TagFunctions.GUILD_COUNT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {guildcount}
    // todo: {guildcount:178313653177548800}

    if (context.guild) {
      tag.text += context.guild.memberCount;
    } else {
      tag.text += '2';
    }
    return true;
  },

  [TagFunctions.GUILD_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {guildid}
    // todo: {guildid:178313653177548800} (useless lmao)

    tag.text += (context.guildId) ? context.guildId : '0';
    return true;
  },

  [TagFunctions.HASTEBIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {hastebin:data}

    return false;
  },

  [TagFunctions.IMAGE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // imagescript 1

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

  [TagFunctions.IMAGESCRIPT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // imagescript 2

    return false;
  },

  [TagFunctions.LOGICAL_DELETE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    if (arg.startsWith(PRIVATE_VARIABLE_PREFIX)) {
      throw new Error(`Tried to delete a private variable, cannot start with '${PRIVATE_VARIABLE_PREFIX}'.`);
    }
    if (MAX_VARIABLE_KEY_LENGTH < arg.length) {
      throw new Error(`Variable cannot be more than ${MAX_VARIABLE_KEY_LENGTH} characters`);
    }
    delete tag.variables[arg];

    return true;
  },

  [TagFunctions.LOGICAL_GET]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.LOGICAL_IF]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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
        const argParsed = await parse(context, x, args, tag.variables);
        for (let file of argParsed.files) {
          tag.files.push(file);
        }
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
      case TagIfComparisons.NOT_EQUAL: {
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
      const argParsed = await parse(context, text, args, tag.variables);
      for (let file of argParsed.files) {
        tag.files.push(file);
      }
      tag.text += argParsed.text;
    } else {
      tag.text += text;
    }

    return true;
  },

  [TagFunctions.LOGICAL_SET]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.MATH]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {math:5+5}

    return false;
  },

  [TagFunctions.MATH_ABS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {abs:integer}

    const value = parseInt(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.abs(value);

    return true;
  },

  [TagFunctions.MATH_COS]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {cos:integer}

    const value = parseInt(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.cos(value);

    return true;
  },

  [TagFunctions.MATH_E]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {e}

    tag.text += Math.E;
    return true;
  },

  [TagFunctions.MATH_MAX]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.MATH_MIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.MATH_PI]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {pi}

    tag.text += Math.PI;
    return true;
  },

  [TagFunctions.MATH_SIN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {sin:number}

    const value = parseInt(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.sin(value);

    return true;
  },

  [TagFunctions.MATH_TAN]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {tan:number}

    const value = parseInt(arg);
    if (isNaN(value)) {
      return false;
    }

    tag.text += Math.tan(value);

    return true;
  },

  [TagFunctions.NSFW]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // errors the command if the channel/user isnt suppose to use nsfw
    // {nsfw}

    if (DefaultParameters.safe(context)) {
      throw new Error('Cannot use a NSFW tag here!');
    }

    return true;
  },

  [TagFunctions.PREFIX]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // the prefix used
    // {prefix}

    if (context instanceof Interaction.InteractionContext) {
      tag.text += '/';
    } else {
      tag.text += context.prefix;
    }

    return true;
  },

  [TagFunctions.RNG_CHOOSE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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
      const argParsed = await parse(context, value, args, tag.variables);
      tag.text += argParsed.text;
      for (let file of argParsed.files) {
        tag.files.push(file);
      }
    } else {
      tag.text += value;
    }

    return true;
  },

  [TagFunctions.RNG_RANGE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {range:50}
    // {range:50|100}
    // {random:50|100}

    if (!arg) {
      return false;
    }

    let firstValue = '0', secondValue = '0';
    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      secondValue = arg.split('.').shift() as string;
    } else {
      const firstSplitter = arg.indexOf(TagSymbols.SPLITTER_ARGUMENT);
      firstValue = arg.slice(0, firstSplitter).split('.').shift() as string;
      secondValue = arg.slice(firstSplitter + 1).split('.').shift() as string;
    }

    if (isNaN(firstValue as any) || isNaN(secondValue as any)) {
      return false;
    }

    tag.text += bigIntGenerateBetween(BigInt(firstValue), BigInt(secondValue));

    return true;
  },

  [TagFunctions.STRING_CODEBLOCK]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {code:text}

    tag.text += Markup.codeblock(arg);
    return true;
  },

  [TagFunctions.STRING_NEWLINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.STRING_LENGTH]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {len:text}

    tag.text += arg.length;
    return true;
  },

  [TagFunctions.STRING_LOWER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {lower:text}

    tag.text += arg.toLowerCase();
    return true;
  },

  [TagFunctions.STRING_REPEAT]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {repeat:50|lol}

    if (!arg.includes(TagSymbols.SPLITTER_ARGUMENT)) {
      return false;
    }

    const [ amountText, ...value ] = split(arg);
    const amount = parseInt(amountText.trim());
    if (isNaN(amount)) {
      return false;
    }

    if (MAX_REPEAT_AMOUNT < amount) {
      throw new Error(`really man, more than ${MAX_REPEAT_AMOUNT} repeats?`);
    }

    const text = value.join(TagSymbols.SPLITTER_ARGUMENT).trim();
    if (MAX_STRING_LENGTH < text.length * amount) {
      throw new Error('ok buddy, dont repeat too much text man');
    }
    tag.text += text.repeat(amount);

    return true;
  },

  [TagFunctions.STRING_REPLACE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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
      tag.text += runInNewContext(
        `source.replace(new RegExp(regex, 'gi'), replaceWith);`,
        {
          regex: regex.trim(),
          source,
          replaceWith,
        },
        {timeout: MAX_REGEX_TIME},
      );
    } catch {
      throw new Error('text replacing errored or timed out');
    }

    return true;
  },

  [TagFunctions.STRING_REVERSE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {reverse:text}

    tag.text += arg.split('').reverse().join('');
    return true;
  },

  [TagFunctions.STRING_SUB]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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
      const parsed = await parse(context, startText, args, tag.variables);
      start = parseInt(parsed.text.trim());
      for (let file of parsed.files) {
        tag.files.push(file);
      }
      if (isNaN(start)) {
        return false;
      }
    }

    let end: number | undefined;
    if (endText !== undefined) {
      const parsed = await parse(context, endText, args, tag.variables);
      end = parseInt(parsed.text.trim());
      for (let file of parsed.files) {
        tag.files.push(file);
      }
      if (isNaN(end)) {
        return false;
      }
    }

    // parse it
    const argParsed = await parse(context, text, args, tag.variables);
    tag.text += argParsed.text.substring(start, end);
    for (let file of argParsed.files) {
      tag.files.push(file);
    }

    return true;
  },

  [TagFunctions.STRING_UPPER]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {upper:text}

    tag.text += arg.toUpperCase();
    return true;
  },

  [TagFunctions.STRING_URL_ENCODE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
    // {url:text}

    tag.text += encodeURIComponent(arg);
    return true;
  },

  [TagFunctions.USER_DISCRIMINATOR]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_MENTION]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_NAME]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_NICK]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_RANDOM]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_RANDOM_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_RANDOM_ONLINE]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_RANDOM_ONLINE_ID]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_RANDOM_ONLINE_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_RANDOM_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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

  [TagFunctions.USER_TAG]: async (context: Command.Context | Interaction.InteractionContext, arg: string, args: Array<string>, tag: TagResult): Promise<boolean> => {
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
