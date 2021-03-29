import { Command } from 'detritus-client';


import { utilitiesFetchImage } from '../api';

import * as Parameters from './parameters';


const memberOrUser = Parameters.memberOrUser();


export const ATTACHMENT_EXTENSIONS = ['bmp', 'heic', 'gif', 'ico', 'jpg', 'jpeg', 'png', 'raw', 'tiff', 'webp'];
export const DEFAULT_REMAINING_ITERATIONS = 100;
export const MAX_NETWORK_REQUESTS = 10;

export const TagFunctions = Object.freeze({
  ARG: ['arg'],
  ARGS: ['args'],
  ARGSLEN: ['argslen'],
  ATTACHMENT: ['attachment', 'attach', 'file'],
  ATTACHMENT_LAST: ['last_attachment', 'lattachment', 'lattach'],
  AVATAR: ['avatar'],
  CHANNEL: ['channel'],
  CHANNEL_ID: ['channelid'],
  CHANNEL_RANDOM: ['randchannel'],
  DOWNLOAD: ['download', 'text'],
  EVAL: ['eval'],
  GUILD: ['guild', 'server'],
  GUILD_COUNT: ['guildcount', 'membercount', 'servercount'],
  GUILD_ID: ['guildid', 'serverid', 'sid', 'gid'],
  HASTEBIN: ['hastebin', 'haste'],
  IGNORE: ['ignore'],
  IMAGE: ['image', 'iscript'],
  IMAGESCRIPT: ['image2', 'iscript2', 'imagescript'],
  LOGICAL_GET: ['get'],
  LOGICAL_IF: ['if'],
  MATH: ['math'],
  NOTE: ['note'],
  NSFW: ['nsfw'],
  PREFIX: ['prefix'],
  RNG_CHOOSE: ['choose'],
  RNG_RANGE: ['range'],
  SET: ['set'],
  STRING_CODEBLOCK: ['code'],
  STRING_LENGTH: ['len', 'length'],
  STRING_LOWER: ['lower'],
  STRING_REPLACE: ['replace', 'replaceregex'],
  STRING_SUB: ['substring'],
  STRING_UPPER: ['upper'],
  STRING_URL_ENCODE: ['url'],
  USER_DISCRIMINATOR: ['discrim'],
  USER_MENTION: ['mention'],
  USER_NAME: ['name', 'user'],
  USER_NICK: ['nick'],
  USER_ID: ['id', 'userid'],
  USER_RANDOM: ['randuser'],
  USER_RANDOM_ID: ['randuserid'],
  USER_RANDOM_ONLINE: ['randonline'],
  USER_RANDOM_ONLINE_ID: ['randonlineid'],
});


export const TagSymbols = Object.freeze({
  BRACKET_LEFT: '{',
  BRACKET_RIGHT: '}',
  SPLITTER_ARGUMENT: '|',
  SPLITTER_FUNCTION: ':',
});


export interface TagVariables {
  __networkRequests: number,
  [key: string]: number | string,
}

export interface TagResult {
  files: Array<{buffer: null | Buffer, filename: string, url: string}>,
  remainingIterations: number,
  text: string,
  variables: TagVariables,
}

export async function parse(
  context: Command.Context,
  value: string,
  args: Array<string>,
  remainingIterations: number = DEFAULT_REMAINING_ITERATIONS,
  variables: TagVariables = {__networkRequests: 0},
): Promise<TagResult> {
  const tag: TagResult = {files: [], remainingIterations, text: '', variables};

  let depth = 0;
  let scriptBuffer = '';
  let position = 0;
  while (position < value.length) {
    if (tag.remainingIterations <= 0) {
      tag.text += value;
      position = value.length;
      continue;
    }

    console.log(position);
    if (depth === 0) {
      // find next left bracket
      const nextLeftBracket = value.indexOf(TagSymbols.BRACKET_LEFT, position);
      if (nextLeftBracket === -1) {
        tag.text += value;
        position = value.length;
        continue;
      }
      tag.text += value.slice(position, nextLeftBracket);
      position = nextLeftBracket;
    }

    if (MAX_NETWORK_REQUESTS <= tag.variables.__networkRequests) {
      throw new Error(`Tag attempted to use too many network requests (Max ${MAX_NETWORK_REQUESTS.toLocaleString()} Requests)`);
    }

    // add network checks
    let result = value.slice(position, ++position);
    scriptBuffer += result;
    console.log(position, result, depth, scriptBuffer);
    switch (result) {
      case TagSymbols.BRACKET_LEFT: {
        // start of the script
        depth++;
      }; break;
      case TagSymbols.BRACKET_RIGHT: {
        // end of the script
        depth--;
        if (depth <= 0) {
          let [scriptName, arg] = parseInnerScript(scriptBuffer);
          if (TagFunctions.IGNORE.includes(scriptName)) {
            tag.text += arg;
            scriptBuffer = '';
            continue;
          } else if (TagFunctions.NOTE.includes(scriptName)) {
            scriptBuffer = '';
            continue;
          }

          {
            const argParsed = await parse(context, arg, args, --tag.remainingIterations, tag.variables);
            arg = argParsed.text;
            for (let file of argParsed.files) {
              tag.files.push(file);
            }
          }
          if (TagFunctions.ARG.includes(scriptName)) {
            const index = parseInt(arg);
            if (isNaN(index)) {
              tag.text += scriptBuffer;
            } else {
              if (index in args) {
                tag.text += args[index];
              }
            }
          } else if (TagFunctions.ARGS.includes(scriptName)) {
            tag.text += args.join(' ');
          } else if (TagFunctions.ARGSLEN.includes(scriptName)) {
            tag.text += String(args.length);
          } else if (TagFunctions.ATTACHMENT.includes(scriptName)) {
            const url = Parameters.url(arg);
            // maybe unfurl instead?
            const filename = ((url.split('/').pop() as string).split('?').shift() as string).split('#').shift() as string;
            const extension = (filename.split('.').pop() as string).toLowerCase();
            if (!ATTACHMENT_EXTENSIONS.includes(extension)) {
              throw new Error('Only images/gifs are supported for attachments.');
            }
            tag.variables.__networkRequests++;

            try {
              const response = await utilitiesFetchImage(context, {url});
              tag.files.push({
                buffer: await response.buffer(),
                filename,
                url,
              });
            } catch(error) {
              console.log(error);
            }
          } else if (TagFunctions.ATTACHMENT_LAST.includes(scriptName)) {
            // give last attachment url
            // actually do it
          } else if (TagFunctions.AVATAR.includes(scriptName)) {
            if (arg) {
              tag.variables.__networkRequests++;
              const user = await memberOrUser(arg, context);
              if (user) {
                tag.text += user.avatarUrl;
              }
            } else {
              tag.text += context.user.avatarUrl;
            }
          } else if (TagFunctions.CHANNEL.includes(scriptName)) {
            const channel = context.channel;
            if (channel) {
              tag.text += channel.name;
            } else {
              tag.text += 'Direct Message';
            }
          } else if (TagFunctions.CHANNEL_ID.includes(scriptName)) {
            tag.text += context.channelId;
          } else if (TagFunctions.CHANNEL_RANDOM.includes(scriptName)) {
            if (context.guild) {
              const channels = Array.from(context.guild.channels.values());
              const channel = channels[Math.floor(Math.random() * channels.length)];
              tag.text += (channel) ? channel.mention : `<#${context.channelId}>`;
            } else {
              tag.text += `<#${context.channelId}>`;
            }
          } else if (TagFunctions.DOWNLOAD.includes(scriptName)) {
            // Actually do it
            tag.variables.__networkRequests++;
            tag.text += 'Temporary Stuff';
          } else if (TagFunctions.EVAL.includes(scriptName)) {
            const argParsed = await parse(context, arg, args, --tag.remainingIterations, tag.variables);
            tag.text += argParsed.text;
            for (let file of argParsed.files) {
              tag.files.push(file);
            }
          } else if (TagFunctions.GUILD.includes(scriptName)) {
            if (context.guild) {
              tag.text += context.guild.name;
            } else {
              tag.text += 'Direct Message';
            }
          } else if (TagFunctions.GUILD_COUNT.includes(scriptName)) {
            if (context.guild) {
              tag.text += context.guild.memberCount;
            } else {
              tag.text += '2';
            }
          } else if (TagFunctions.GUILD_ID.includes(scriptName)) {
            tag.text += (context.guildId) ? context.guildId : '0';
          } else if (TagFunctions.HASTEBIN.includes(scriptName)) {

          } else if (TagFunctions.IMAGE.includes(scriptName)) {

          } else if (TagFunctions.IMAGESCRIPT.includes(scriptName)) {

          } else if (TagFunctions.LOGICAL_GET.includes(scriptName)) {

          } else if (TagFunctions.LOGICAL_IF.includes(scriptName)) {

          } else if (TagFunctions.MATH.includes(scriptName)) {

          } else if (TagFunctions.NSFW.includes(scriptName)) {

          } else if (TagFunctions.PREFIX.includes(scriptName)) {

          } else if (TagFunctions.RNG_CHOOSE.includes(scriptName)) {

          } else if (TagFunctions.RNG_RANGE.includes(scriptName)) {

          } else if (TagFunctions.SET.includes(scriptName)) {

          } else if (TagFunctions.STRING_CODEBLOCK.includes(scriptName)) {

          } else if (TagFunctions.STRING_LENGTH.includes(scriptName)) {
            tag.text += arg.length;
          } else if (TagFunctions.STRING_LOWER.includes(scriptName)) {
            tag.text += arg.toLowerCase();
          } else if (TagFunctions.STRING_REPLACE.includes(scriptName)) {

          } else if (TagFunctions.STRING_SUB.includes(scriptName)) {

          } else if (TagFunctions.STRING_UPPER.includes(scriptName)) {
            tag.text += arg.toUpperCase();
          } else if (TagFunctions.STRING_URL_ENCODE.includes(scriptName)) {
            tag.text += encodeURIComponent(arg);
          } else if (TagFunctions.USER_DISCRIMINATOR.includes(scriptName)) {
            if (arg) {
              tag.variables.__networkRequests++;
              const user = await memberOrUser(arg, context);
              if (user) {
                tag.text += user.discriminator;
              }
            } else {
              tag.text += context.user.discriminator;
            }
          } else if (TagFunctions.USER_MENTION.includes(scriptName)) {
            if (arg) {
              tag.variables.__networkRequests++;
              const user = await memberOrUser(arg, context);
              if (user) {
                tag.text += user.mention;
              }
            } else {
              tag.text += context.user.mention;
            }
          } else if (TagFunctions.USER_NAME.includes(scriptName)) {
            if (arg) {
              tag.variables.__networkRequests++;
              const user = await memberOrUser(arg, context);
              if (user) {
                tag.text += user.username;
              }
            } else {
              tag.text += context.user.username;
            }
          } else if (TagFunctions.USER_NICK.includes(scriptName)) {
            if (arg) {
              tag.variables.__networkRequests++;
              const user = await memberOrUser(arg, context);
              if (user) {
                tag.text += user.name;
              }
            } else {
              tag.text += (context.member) ? context.member.name : context.user.name;
            }
          } else if (TagFunctions.USER_ID.includes(scriptName)) {
            if (arg) {
              tag.variables.__networkRequests++;
              const user = await memberOrUser(arg, context);
              if (user) {
                tag.text += user.id;
              }
            } else {
              tag.text += context.user.id;
            }
          } else if (TagFunctions.USER_RANDOM.includes(scriptName)) {
            // make sure guild is ready `Guild.ready` before getting a random member

          } else if (TagFunctions.USER_RANDOM_ID.includes(scriptName)) {

          } else if (TagFunctions.USER_RANDOM_ONLINE.includes(scriptName)) {
            // all online users are already in cache pretty sure

          } else if (TagFunctions.USER_RANDOM_ONLINE_ID.includes(scriptName)) {

          } else {
            // check if scriptName is a programming language
            tag.text += scriptBuffer;
          }
          scriptBuffer = '';
        }
      }; break;
    }
  }

  tag.text += scriptBuffer;
  return tag;
}


function parseInnerScript(value: string): [string, string] {
  let scriptName: string;
  let arg: string;

  // remove the brackets from both sides of the value
  value = value.slice(1, value.length - 1);

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
