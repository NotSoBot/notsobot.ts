import { Command, Interaction, Structures } from 'detritus-client';

import { mediaICreateGreentext } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, createTimestampMomentFromContext, displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { createMentionsReplacer, resizedProxyUrl } from './fun.quote';


export const COMMAND_ID = 'fun.greentext';

// what the api takes
export const MAX_TEXT_LENGTH = 4000;
export const MAX_NAME_LENGTH = 50;
export const MAX_SUBJECT_LENGTH = 100;
// with its `!`
export const MAX_TRIPCODE_LENGTH = 16;
export const MAX_NUMBER_LENGTH = 10;
// the most backlinks a post is drawn with
export const MAX_REPLIES = 15;

// the site's two classic themes: the tan one and the blue one its worksafe boards use
export const THEMES = ['yotsuba', 'yotsuba-b'] as const;

// how the site writes a post's time: `11/23/26(Mon)15:41:07`
const TIMESTAMP_FORMAT = 'MM/DD/YY(ddd)HH:mm:ss';
// what a tripcode is made of (the letters a password's hash is written in there)
const TRIPCODE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
const TRIPCODE_LENGTH = 10;

// a 4chan post. it has no account: the name is `Anonymous` unless one is given, and a message it's made from stays
// anonymous too. a message by itself is the post, a message with text (or an image) beside it is the post that text
// replies to, drawn above it
export interface CommandArgs {
  // only picks the theme and how big the post numbers are
  board?: null | string,
  // what the `File:` line says about `image` when it's an upload (its real name, size and dimensions)
  file?: null | RestOptions.MediaICreateGreentextFile,
  image?: null | string,
  message?: null | Structures.Message,
  name?: null | string,
  number?: null | string,
  // the top post opens the thread
  op?: null | boolean,
  // how many backlinks
  replies?: null | number,
  subject?: null | string,
  text?: null | string,
  theme?: null | RestOptions.MediaICreateGreentext['theme'],
  time?: null | Date,
  tripcode?: null | string,
  // the prefixed command's `@user text` shortcut, the post is under their name
  user?: null | Structures.Member | Structures.User,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const options = await createGreentextOptions(context, args);
  if (!options) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }
  const response = await mediaICreateGreentext(context, options);
  return mediaReply(context, response, {filename: 'greentext'});
}


export async function createGreentextOptions(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
): Promise<RestOptions.MediaICreateGreentext | null> {
  const text = (args.text || '').trim();
  const message = args.message || null;
  // an image sent with a prefixed command is the post's, there's none on a slash command (its options carry it)
  const upload = (context instanceof Command.Context) ? firstAttachmentImage(context.message) : null;
  const image = (args.image) ? {file: args.file || undefined, url: args.image} : upload;

  // a message with nothing beside it is the post itself, with text or an image it's what that replies to
  const source = (message && !text && !image) ? message : null;
  const parent = (message && !source) ? message : null;
  if (!text && !image && !source) {
    return null;
  }

  const replaceMentions = await createMentionsReplacer(context, [
    text,
    (message) ? message.content : '',
    args.name || '',
    args.subject || '',
  ]);

  const location = {guildId: context.guildId, userId: context.userId};
  let unix = (args.time) ? args.time.getTime() : ((source) ? source.createdAtUnix : Date.now());
  if (args.time && !(unix % 60000)) {
    // a time typed without seconds (`9:41am`), the site always shows some
    unix += Math.floor(Math.random() * 60) * 1000;
  }
  const timestamp = (value: number) => createTimestampMomentFromContext(value, location).locale('en').format(TIMESTAMP_FORMAT);

  const sourceImage = (source) ? firstAttachmentImage(source) : null;
  const picture = image || sourceImage;
  const subject = (args.subject) ? replaceMentions(args.subject).trim().slice(0, MAX_SUBJECT_LENGTH) : undefined;
  const post: RestOptions.MediaICreateGreentextPost = {
    content: toGreentext(replaceMentions((source) ? source.content : text)).slice(0, MAX_TEXT_LENGTH),
    file: (picture) ? picture.file : undefined,
    imageUrl: (picture) ? picture.url : undefined,
    name: ((args.name) ? replaceMentions(args.name, true) : ((args.user) ? args.user.name : '')).trim().slice(0, MAX_NAME_LENGTH) || undefined,
    time: Math.floor(unix / 1000),
    timestamp: timestamp(unix),
    tripcode: (typeof(args.tripcode) === 'string') ? cleanTripcode(args.tripcode) : undefined,
  };
  if (!post.content && !post.imageUrl) {
    return null;
  }

  const options: RestOptions.MediaICreateGreentext = {
    board: args.board || undefined,
    number: (args.number) ? cleanNumber(args.number) : undefined,
    op: !!args.op,
    post,
    replies: (typeof(args.replies) === 'number') ? Math.min(args.replies, MAX_REPLIES) : undefined,
    safe: DefaultParameters.safe(context),
    theme: args.theme || undefined,
  };
  if (parent) {
    // posted before the reply to it, whatever time that was given
    let parentUnix = parent.createdAtUnix;
    if (unix <= parentUnix) {
      parentUnix = unix - (60 + Math.floor(Math.random() * 540)) * 1000;
    }
    const parentImage = firstAttachmentImage(parent);
    options.parent = {
      content: toGreentext(replaceMentions(parent.content)).slice(0, MAX_TEXT_LENGTH),
      file: (parentImage) ? parentImage.file : undefined,
      imageUrl: (parentImage) ? parentImage.url : undefined,
      time: Math.floor(parentUnix / 1000),
      timestamp: timestamp(parentUnix),
    };
    if (!options.parent.content && !options.parent.imageUrl) {
      // a message with nothing a post can show (only an embed), the reply is drawn by itself
      options.parent = undefined;
    }
  }
  // a thread's subject is its opening post's
  if (subject) {
    ((options.op && options.parent) ? options.parent : post).subject = subject;
  }
  return options;
}


// text the way it's typed on discord to the way it's typed there. discord shows `> text` as a quote (and people type it
// that way to get one), the site's is `>text`. `>>> text` quotes everything after it on discord, so every line after
// it is green. a slash command's text is one line, there `>be me >go outside >mfw` is three: it's broken before each
// ` >` that starts a word, but not before a quote link (`>>123`, `>>>/g/123`)
const REGEX_GREEN_BREAK = / +>(?=\S)(?!>\d|>>\/)/g;

export function toGreentext(value: string): string {
  let text = value.trim();
  if (!text.includes('\n') && text.startsWith('>')) {
    text = text.replace(REGEX_GREEN_BREAK, '\n>');
  }
  let block = false;
  return text.split('\n').map((line) => {
    // typed with a backslash so discord wouldn't make it a quote
    line = line.replace(/^\\>/, '>');
    if (!block && /^>>>(?: |$)/.test(line)) {
      block = true;
      line = line.slice(3).trim();
      return (line) ? `>${line}` : line;
    }
    line = line.replace(/^> +(?=\S)/, '>');
    return (block && line.trim() && !line.startsWith('>')) ? `>${line}` : line;
  }).join('\n').trim();
}


// a tripcode as typed, with or without its `!` (a secure one has two). nothing typed makes one up
export function cleanTripcode(value: string): string {
  const tripcode = value.replace(/\s+/g, '');
  if (!tripcode.replace(/^!+/, '')) {
    return createTripcode();
  }
  return ((tripcode.startsWith('!')) ? tripcode : `!${tripcode}`).slice(0, MAX_TRIPCODE_LENGTH);
}

export function createTripcode(): string {
  let tripcode = '!';
  for (let i = 0; i < TRIPCODE_LENGTH; i++) {
    tripcode += TRIPCODE_CHARACTERS[Math.floor(Math.random() * TRIPCODE_CHARACTERS.length)];
  }
  return tripcode;
}


// a post number as typed (`No.12345677`, `#12345677`, `12,345,677`): its digits as they are, zeros in front too, so
// the repeating ones someone typed stay. undefined when there are none (one is made up then)
export function cleanNumber(value: string): string | undefined {
  return value.replace(/\D/g, '').slice(0, MAX_NUMBER_LENGTH) || undefined;
}


// what the `File:` line says about an upload: its own name, size and dimensions. the url the api gets is discord's
// resized copy, it can't read these off that
export function attachmentFile(attachment: Structures.Attachment): RestOptions.MediaICreateGreentextFile {
  return {
    height: attachment.height || undefined,
    name: (attachment.filename || '').slice(0, 256) || undefined,
    size: attachment.size || undefined,
    width: attachment.width || undefined,
  };
}

// an uploaded image (or a video, its first frame) as a post's file
export function attachmentImage(attachment: Structures.Attachment): null | {file: RestOptions.MediaICreateGreentextFile, url: string} {
  if (!attachment.isImage && !attachment.isVideo) {
    return null;
  }
  const url = resizedProxyUrl(attachment.proxyUrl || attachment.url, attachment.width, attachment.height, attachment.isVideo);
  return (url) ? {file: attachmentFile(attachment), url} : null;
}

function firstAttachmentImage(message: Structures.Message): null | {file: RestOptions.MediaICreateGreentextFile, url: string} {
  for (let attachment of message.attachments.values()) {
    const image = attachmentImage(attachment);
    if (image) {
      return image;
    }
  }
  return null;
}
