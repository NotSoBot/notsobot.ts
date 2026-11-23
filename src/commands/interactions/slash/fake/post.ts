import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';


// what `/fake tweet` and `/fake truth` share: who the post is from and what's in it. each adds its own counts, badge
// and theme after these (`postOptions`) and before the last ones (`postEndOptions`)
export interface PostCommandArgs {
  from?: string,
  handle?: string,
  image?: Structures.Attachment,
  imageUrl?: string,
  likes?: number,
  message?: Parameters.QuoteTarget,
  name?: string,
  portrait?: string,
  portraitAttachment?: Structures.Attachment,
  replyTo?: string,
  text?: string,
  time?: Date,
  user?: Structures.Member | Structures.User,
}

const { MAX_HANDLE_LENGTH, MAX_NAME_LENGTH, MAX_TEXT_LENGTH } = Formatter.Commands.FunTweet;

// a count option, typed like people write them (`12.5k`), so a string and not discord's integer
export function countOption(name: string, description: string, key: string): Interaction.InteractionCommandOptionOptions {
  return {
    name,
    description,
    ...I18n.optionLocalizations(`commands.fun.post.${key}`),
    maxLength: 16,
    value: Parameters.count,
  };
}

export function postOptions(): Array<Interaction.InteractionCommandOptionOptions> {
  return [
    {
      name: 'text',
      description: 'What the post says',
      ...I18n.optionLocalizations('commands.fun.post.text'),
      maxLength: MAX_TEXT_LENGTH,
      value: Parameters.string({maxLength: MAX_TEXT_LENGTH}),
    },
    {
      name: 'user',
      description: 'A Discord user to post as (Default: you)',
      ...I18n.optionLocalizations('commands.fun.post.user'),
      type: ApplicationCommandOptionTypes.USER,
    },
    {
      name: 'message',
      description: 'A message link or id: by itself it becomes the post, with text it is quoted',
      ...I18n.optionLocalizations('commands.fun.post.message'),
      value: Parameters.quote,
    },
    {
      name: 'from',
      description: 'A real account\'s handle on the site, to copy its name, portrait and badge',
      ...I18n.optionLocalizations('commands.fun.post.from'),
      maxLength: MAX_HANDLE_LENGTH + 1,
      value: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}),
    },
    {
      name: 'name',
      description: 'The display name',
      ...I18n.optionLocalizations('commands.fun.post.name'),
      maxLength: MAX_NAME_LENGTH,
      value: Parameters.string({maxLength: MAX_NAME_LENGTH}),
    },
    {
      name: 'handle',
      description: 'The @handle under the name',
      ...I18n.optionLocalizations('commands.fun.post.handle'),
      maxLength: MAX_HANDLE_LENGTH + 1,
      value: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}),
    },
    {
      name: 'portrait',
      description: 'Emoji/Image URL/User for the profile picture',
      ...I18n.optionLocalizations('commands.fun.post.portrait'),
      value: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}),
    },
    {
      name: 'portrait-attachment',
      description: 'Image File for the profile picture',
      ...I18n.optionLocalizations('commands.fun.post.portrait_attachment'),
      label: 'portraitAttachment',
      type: ApplicationCommandOptionTypes.ATTACHMENT,
    },
    {
      name: 'image',
      description: 'Image File shown under the text',
      ...I18n.optionLocalizations('commands.fun.post.image'),
      type: ApplicationCommandOptionTypes.ATTACHMENT,
    },
    {
      name: 'image-url',
      description: 'Emoji/Image URL/User for the image under the text',
      ...I18n.optionLocalizations('commands.fun.post.image_url'),
      label: 'imageUrl',
      value: Parameters.mediaUrl({audio: false, onlyContent: true, video: false}),
    },
    countOption('likes', 'How many likes, like 1234 or 12.5k (Default: made up)', 'likes'),
  ];
}

export function postEndOptions(): Array<Interaction.InteractionCommandOptionOptions> {
  return [
    {
      name: 'time',
      description: 'When it was sent, like "jan 6 2021 9:41am" or "2 hours ago" (Default: now)',
      ...I18n.optionLocalizations('commands.fun.post.time'),
      value: Parameters.timestampAny,
    },
    {
      name: 'reply-to',
      description: 'Who it replies to, a user or a handle (adds the "Replying to" line)',
      ...I18n.optionLocalizations('commands.fun.post.reply_to'),
      label: 'replyTo',
      maxLength: 64,
      value: Parameters.string({maxLength: 64}),
    },
  ];
}

// the shared options as the formatters take them, an uploaded file goes before what the url option names
export function postArgs(args: PostCommandArgs): Formatter.Commands.FunTweet.PostCommandArgs {
  const image = args.image;
  const portrait = args.portraitAttachment;
  return {
    from: args.from,
    handle: args.handle,
    image: (image) ? (image.url || image.proxyUrl || undefined) : args.imageUrl,
    likes: args.likes,
    message: (args.message) ? args.message.message : null,
    name: args.name,
    portrait: (portrait) ? (portrait.url || portrait.proxyUrl || undefined) : args.portrait,
    replyto: args.replyTo,
    text: args.text,
    time: args.time,
    user: args.user,
  };
}
