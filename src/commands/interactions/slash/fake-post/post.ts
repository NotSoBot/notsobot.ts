import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';


// what the post commands share (`/fake-post tweet`, `truth`, `bluesky` and the other groups' sites): who the post is
// from and what's in it. each adds its own counts, badge and theme after these (`postOptions`) and before the last ones
// (`postEndOptions`), and can leave out the ones its site doesn't have (`omit`, by option name)
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
  quote?: string,
  replyTo?: string,
  text?: string,
  time?: Date,
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

// which look of a site that has had two, an option of its own beside the color theme. `names` is what a site calls its
// looks when old and new don't say enough
export function layoutOption(
  // none when it's whichever the site draws (a real post from any site)
  defaultChoice?: RestOptions.MediaICreatePostLayout,
  names?: Record<RestOptions.MediaICreatePostLayout, string>,
): Interaction.InteractionCommandOptionOptions {
  return {
    name: 'layout',
    description: 'The site\'s old look or its new one',
    ...I18n.optionLocalizations('commands.fun.post.layout'),
    choices: Parameters.Slash.oneOf({
      choices: {OLD: 'old', NEW: 'new'},
      defaultChoice,
      descriptions: names,
      doNotSort: true,
    }),
  };
}

// a link to a real post as the one the post quotes, for the sites whose posts show another inside them
export function quoteOption(): Interaction.InteractionCommandOptionOptions {
  return {
    name: 'quote',
    description: 'A link to a real post to show quoted under yours',
    ...I18n.optionLocalizations('commands.fun.post.quote'),
    maxLength: 2048,
    value: Parameters.string({maxLength: 2048}),
  };
}

export type PostSite = RestOptions.MediaICreatePostAccounts['site'];

function without(options: Array<Interaction.InteractionCommandOptionOptions>, omit: Array<string>): Array<Interaction.InteractionCommandOptionOptions> {
  return options.filter((option) => !omit.includes(option.name as string));
}

// `site` is null for one with no accounts to look up: `from` there is a mention or a name typed as is, and only offers
// the members here
export function postOptions(site: null | PostSite, omit: Array<string> = []): Array<Interaction.InteractionCommandOptionOptions> {
  return without([
    {
      name: 'text',
      description: 'What the post says',
      ...I18n.optionLocalizations('commands.fun.post.text'),
      maxLength: MAX_TEXT_LENGTH,
      value: Parameters.string({maxLength: MAX_TEXT_LENGTH}),
    },
    {
      name: 'from',
      description: (site) ? 'Who it\'s from: a @mention, or a real account\'s handle on the site (Default: you)' : 'Who it\'s from: a @mention, or any name typed as is (Default: you)',
      ...I18n.optionLocalizations('commands.fun.post.from'),
      // the same option name, its own description where there's nobody to look up
      ...((site) ? {} : {descriptionLocalizations: I18n.optionLocalizations('commands.fun.post.from_typed').descriptionLocalizations}),
      maxLength: MAX_HANDLE_LENGTH + 1,
      // members here and the accounts already known are offered, any other mention or handle can still be typed
      onAutoComplete: (site) ? Formatter.Commands.FunTweet.autocompleteFrom(site) : Formatter.Commands.FunTweet.autocompleteFromMembers,
      value: Parameters.string({maxLength: MAX_HANDLE_LENGTH + 1}),
    },
    {
      name: 'message',
      description: 'A message link or id: by itself it becomes the post, with text it is quoted',
      ...I18n.optionLocalizations('commands.fun.post.message'),
      value: Parameters.quote,
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
  ], omit);
}

export function postEndOptions(omit: Array<string> = []): Array<Interaction.InteractionCommandOptionOptions> {
  return without([
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
  ], omit);
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
    quote: args.quote,
    replyto: args.replyTo,
    text: args.text,
    time: args.time,
  };
}
