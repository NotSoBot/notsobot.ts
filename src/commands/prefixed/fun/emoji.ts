import { onlyEmoji } from 'emoji-aware';

import { Command, CommandClient } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';

import { imageToolsResize } from '../../../api';
import { CDN, CUSTOM } from '../../../api/endpoints';
import { CommandTypes, EmojiTypes, Mimetypes } from '../../../constants';
import { Parameters, editOrReply, imageReply, toCodePoint } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  emojis: string,
  size: number,
  type: EmojiTypes,
}

export interface CommandArgs {
  emojis: string,
  size: number,
  type: EmojiTypes,
}

export const COMMAND_NAME = 'emoji';


const CHOICES = Object.values(EmojiTypes);

export default class EmojiCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['e'],
      args: [
        {
          name: 'size',
          default: 512,
          type: Parameters.number({max: 2048, min: 8}),
        },
        {
          name: 'type',
          choices: CHOICES,
          default: EmojiTypes.TWEMOJI,
          help: `Must be one of: (${CHOICES.join(', ')})`,
          type: Parameters.stringLowerCase(),
        },
      ],
      label: 'emojis',
      metadata: {
        examples: [
          `${COMMAND_NAME} 😩`,
          `${COMMAND_NAME} 😩 -type apple`,
          `${COMMAND_NAME} 😩 -type google -size 1024`,
        ],
        type: CommandTypes.FUN,
        usage: '<emojis> (-type <EmojiTypes>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.emojis;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const urls: Array<string> = [];

    for (let value of args.emojis.split(' ')) {
      value = value.trim();
      if (!value) {
        continue;
      }

      // try to see if it's <a:emoji:id>
      {
        const { matches } = discordRegex(DiscordRegexNames.EMOJI, value) as {matches: Array<{animated: boolean, id: string}>};
        if (matches.length) {
          for (let { animated, id} of matches) {
            const format = (animated) ? 'gif' : 'png';
            urls.push(DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format));
          }
          continue;
        }
      }

      switch (args.type) {
        case EmojiTypes.APPLE: {
          const codepoints = getEmojiCodePoints(value);
          for (let codepoint of codepoints) {
            urls.push(CDN.URL + CDN.EMOJIS_APPLE(codepoint));
          }
        }; break;
        case EmojiTypes.EMOJI_ONE: {
          const codepoints = getEmojiCodePoints(value);
          for (let codepoint of codepoints) {
            // emoji one
          }
        }; break;
        case EmojiTypes.FACEBOOK: {
          const codepoints = getEmojiCodePoints(value);
          for (let codepoint of codepoints) {
            // facebook emoji
          }
        }; break;
        case EmojiTypes.GOOGLE: {
          const codepoints = getEmojiCodePoints(value);
          for (let codepoint of codepoints) {
            // google emoji
          }
        }; break;
        case EmojiTypes.MICROSOFT: {
          const codepoints = getEmojiCodePoints(value);
          for (let codepoint of codepoints) {
            // microsoft emoji
          }
        }; break;
        case EmojiTypes.STEAM: {
          // steam emoji
          urls.push(CUSTOM.STEAM_EMOJI(value));
        }; break;
        case EmojiTypes.TWEMOJI: {
          // twemoji
          const codepoints = getEmojiCodePoints(value);
          for (let codepoint of codepoints) {
            urls.push(CDN.URL + CDN.EMOJIS_TWEMOJI(codepoint));
          }
        }; break;
        case EmojiTypes.TWITCH: {
          // twitch emoji
        }; break;
      }
    }

    if (urls.length) {
      const [ url ] = urls;
      // if its a single url, resize
      // if multiple, merge
      const response = await imageToolsResize(context, {size: String(args.size), url});
      response.headers.delete('x-args');
      return imageReply(context, response);
    }
    return editOrReply(context, '⚠ Unable to find any images matching that...');
  }
}


function getEmojiCodePoints(value: string): Array<string> {
  const emojis = onlyEmoji(value);
  if (emojis && emojis.length) {
    return emojis.map((emoji) => toCodePoint(emoji));
  }
  return [];
}
