import { onlyEmoji } from 'emoji-aware';

import { Command, Interaction } from 'detritus-client';
import { DiscordRegexNames } from 'detritus-client/lib/constants';
import { regex as discordRegex } from 'detritus-client/lib/utils';
import { Endpoints as DiscordEndpoints } from 'detritus-client-rest';

import { mediaIVToolsResize } from '../../../api';
import { CDN, CUSTOM } from '../../../api/endpoints';
import { BooleanEmojis, EmojiTypes, EmojiTypesToText, Mimetypes } from '../../../constants';
import { editOrReply, jobReply, jobWaitForResult, toCodePoint, toCodePointForTwemoji } from '../../../utils';


export const COMMAND_ID = 'fun.emoji';

export const DEFAULT_EMOJI_TYPE = EmojiTypes.TWEMOJI;

export const SLASH_CHOICES = [
  EmojiTypes.APPLE,
  //EmojiTypes.EMOJI_ONE,
  //EmojiTypes.FACEBOOK,
  EmojiTypes.GOOGLE,
  EmojiTypes.MICROSOFT,
  EmojiTypes.STEAM,
  EmojiTypes.TWEMOJI,
  //EmojiTypes.TWITCH,
].map((x) => {
  let name = EmojiTypesToText[x];
  if (x === DEFAULT_EMOJI_TYPE) {
    name = `${name} (Default)`;
  }
  return {name, value: x};
}).sort((x) => (x.value === DEFAULT_EMOJI_TYPE) ? -1 : 0);


export interface CommandArgs {
  emojis: string,
  size: number,
  type: EmojiTypes,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
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
        for (let { animated, id } of matches) {
          const format = (animated) ? 'gif' : 'png';
          urls.push(DiscordEndpoints.CDN.URL + DiscordEndpoints.CDN.EMOJI(id, format));
        }
        continue;
      }
    }

    switch (args.type) {
      case EmojiTypes.APPLE: {
        const codepoints = getEmojiCodePoints(value, args.type);
        for (let codepoint of codepoints) {
          urls.push(CUSTOM.APPLE_EMOJI(codepoint));
          //urls.push(CDN.URL + CDN.EMOJIS_APPLE(codepoint));
        }
      }; break;
      case EmojiTypes.EMOJI_ONE: {
        const codepoints = getEmojiCodePoints(value, args.type);
        for (let codepoint of codepoints) {
          // emoji one
        }
      }; break;
      case EmojiTypes.FACEBOOK: {
        const codepoints = getEmojiCodePoints(value, args.type);
        for (let codepoint of codepoints) {
          // facebook emoji
        }
      }; break;
      case EmojiTypes.GOOGLE: {
        const codepoints = getEmojiCodePoints(value, args.type);
        for (let codepoint of codepoints) {
          // google emoji
          urls.push(CUSTOM.GOOGLE_EMOJI(codepoint));
        }
      }; break;
      case EmojiTypes.MICROSOFT: {
        const codepoints = getEmojiCodePoints(value, args.type);
        for (let codepoint of codepoints) {
          // microsoft emoji
          urls.push(CUSTOM.MICROSOFT_EMOJI(codepoint));
        }
      }; break;
      case EmojiTypes.STEAM: {
        // steam emoji
        urls.push(CUSTOM.STEAM_EMOJI(value));
      }; break;
      case EmojiTypes.TWEMOJI: {
        // twemoji
        const codepoints = getEmojiCodePoints(value, args.type);
        for (let codepoint of codepoints) {
          urls.push(CUSTOM.TWEMOJI_SVG(codepoint));
        }
      }; break;
      case EmojiTypes.TWITCH: {
        // twitch emoji
      }; break;
    }
  }

  if (urls.length) {
    const size = String(args.size);
    const filtered = Array.from(new Set(urls));

    // maybe instead of each one, merge all the emojis?
    if (filtered.length === 1) {
      const [ url ] = filtered;
      // if its a single url, embed it
      const job = await mediaIVToolsResize(context, {size, url});
      return jobReply(context, job); // todo: disable showing args here
    }

    const promises: Array<Promise<{filename: string, value: Buffer}>> = [];
    for (let url of filtered.slice(0, 10)) {
      const promise: Promise<{filename: string, value: Buffer}> = new Promise(async (resolve, reject) => {
        try {
          const job = await mediaIVToolsResize(context, {size, url}).then((x) => jobWaitForResult(context, x));
          if (job.result.response) {
            resolve({
              filename: job.result.response.file.filename,
              value: (job.result.response.file.value) ? Buffer.from(job.result.response.file.value, 'base64') : Buffer.alloc(0),
            });
          } else if (job.result.error) {
            throw new Error(`Emoji Resize Job Failed: ${job.result.error}`);
          } else {
            throw new Error('Emoji Resize Job Failed for some reason');
          }
        } catch(error) {
          reject(error);
        }
      });
      promises.push(promise);
    }

    const files = await Promise.all(promises);
    return editOrReply(context, {files});
  }
  return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find any images matching that.`);
}


export function getEmojiCodePoints(value: string, type: EmojiTypes): Array<string> {
  const emojis = onlyEmoji(value);
  if (emojis && emojis.length) {
    return emojis.map((emoji) => {
      switch (type) {
        case EmojiTypes.APPLE:
        case EmojiTypes.GOOGLE:
        case EmojiTypes.TWEMOJI: {
          return toCodePointForTwemoji(emoji);
        };
      }
      return toCodePoint(emoji);
    });
  }
  return [];
}
