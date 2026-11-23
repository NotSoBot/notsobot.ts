import { Command, Interaction, Structures } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreatePostAccounts, mediaICreateTweet } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, createTimestampMomentFromContext, displayReply, fetchMemberOrUserById, getTimezoneFromContext, mediaReply } from '../../../utils';
import { UserError } from '../../errors';
import { getTranslator } from '../../i18n';

import { createMentionsReplacer, firstAttachmentImageUrl, firstImageUrl } from './fun.quote';


export const COMMAND_ID = 'fun.tweet';

// what the api takes, the sites' own limits are far lower
export const MAX_TEXT_LENGTH = 4000;
export const MAX_NAME_LENGTH = 50;
// bluesky's are domains (`name.bsky.social`), the longest of the sites'
export const MAX_HANDLE_LENGTH = 64;
export const MAX_NOTE_LENGTH = 1000;
const MAX_QUOTE_LENGTH = 1000;

// x's checks after a name: a subscriber's, a business', a government's
export const VERIFIED_TYPES = ['blue', 'gold', 'grey', 'none'] as const;
export const VERIFIED_ALIASES: Record<string, RestOptions.MediaICreatePostVerified> = {
  business: 'gold',
  government: 'grey',
  gray: 'grey',
  no: 'none',
  off: 'none',
  yes: 'blue',
};
export const THEMES = ['dark', 'dim', 'light'] as const;

// how x writes a post's time, and the date of a post quoted inside one
const TIMESTAMP_FORMAT = 'h:mm A · MMM D, YYYY';
const REGEX_HANDLE = /^[A-Za-z0-9_.-]{1,64}$/;

// what `tweet` and `truth` both take. a post is from whoever used the command unless `from` says otherwise, and `name`,
// `handle`, `portrait` and `verified` go over whoever that is
export interface PostCommandArgs {
  // who it's from, the one option for it: a discord user's mention (`<@id>`, what the suggestions give for a member),
  // or a real account's handle on the site, whose name, avatar and badge are copied
  from?: null | string,
  handle?: null | string,
  // one image under the text, any url
  image?: null | string,
  likes?: null | number,
  // a real message: by itself it's the post (its author, text, first image and time), with `text` it's quoted under it
  message?: null | Structures.Message,
  name?: null | string,
  portrait?: null | string,
  // a link to a real post, shown as the one this quotes (on the sites whose posts have a quoted post's card)
  quote?: null | string,
  // who it replies to, a mention or a handle
  replyto?: null | string,
  reposts?: null | number,
  text?: null | string,
  time?: null | Date,
  // the prefixed command's `@user text` shortcut, `from` goes over it
  user?: null | Structures.Member | Structures.User,
  verified?: null | RestOptions.MediaICreatePostVerified,
}

export interface CommandArgs extends PostCommandArgs {
  bookmarks?: null | number,
  // a community note under the post
  note?: null | string,
  replies?: null | number,
  theme?: null | RestOptions.MediaICreateTweet['theme'],
  views?: null | number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const post = await createPostOptions(context, args, {extraTexts: [args.note || ''], timestamp: TIMESTAMP_FORMAT});
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const response = await mediaICreateTweet(context, {
    ...post.options,
    bookmarks: args.bookmarks,
    note: (args.note) ? post.replaceMentions(args.note).slice(0, MAX_NOTE_LENGTH) : undefined,
    replies: args.replies,
    theme: args.theme || 'dark',
    views: args.views,
  });
  return mediaReply(context, response, {filename: 'tweet'});
}


// `from`'s suggestions while a handle is typed: the ones they used before, accounts someone's lookup already found and
// a few well known ones. the api only reads what it has (this runs on every keystroke), the site is asked when the
// command runs, so a handle that isn't offered still works
//
// members of the server whose name starts with what's typed come first, their choice is their mention (a member and an
// account can have the same name, the label says which each one is). only members the bot has cached, a mention typed
// by hand works for anyone
const SITE_LABELS: Record<RestOptions.MediaICreatePostAccounts['site'], string> = {bluesky: 'Bluesky', mastodon: 'Mastodon', threads: 'Threads', steam: 'Steam',tiktok: 'TikTok', truth: 'Truth Social', twitch: 'Twitch', x: 'X', youtube: 'YouTube'};
const MAX_CHOICES = 25;
const MAX_MEMBER_CHOICES = 5;

// the server's members matching what's typed (or the one already picked, a mention), each one's choice is their mention
function memberChoices(context: Interaction.InteractionAutoCompleteContext, typed: string, limit: number): Array<{name: string, value: string}> {
  const choices: Array<{name: string, value: string}> = [];
  const mention = typed.match(REGEX_FROM_MENTION);
  const query = typed.replace(/^@+/, '').toLowerCase();
  const guild = context.guild;
  if (guild && (mention || query)) {
    for (let member of guild.members.values()) {
      const matches = (mention) ? member.id === mention[1] : (member.username.toLowerCase().startsWith(query) || member.name.toLowerCase().startsWith(query));
      if (matches) {
        const name = (member.name !== member.username) ? `${member.name} (@${member.username})` : `@${member.username}`;
        choices.push({name: `${name.slice(0, 80)} · Discord`, value: `<@${member.id}>`});
        if (limit <= choices.length) {
          break;
        }
      }
    }
  }
  return choices;
}

// `from` on a site with no accounts to look up (`typedFrom`): only members here are offered, any other text typed is
// the name itself
export async function autocompleteFromMembers(context: Interaction.InteractionAutoCompleteContext) {
  return context.respond({choices: memberChoices(context, (context.value || '').trim(), MAX_CHOICES)});
}

export function autocompleteFrom(site: RestOptions.MediaICreatePostAccounts['site']) {
  return async (context: Interaction.InteractionAutoCompleteContext) => {
    const typed = (context.value || '').trim();
    const mention = typed.match(REGEX_FROM_MENTION);
    const choices = memberChoices(context, typed, MAX_MEMBER_CHOICES);

    // a mention is nobody's handle
    if (!mention) {
      try {
        const { accounts } = await mediaICreatePostAccounts(context, {query: typed.slice(0, MAX_HANDLE_LENGTH + 1), site});
        for (let account of accounts) {
          const name = (account.name && account.name !== account.handle) ? `${account.name} (@${account.handle})` : `@${account.handle}`;
          choices.push({name: `${name.slice(0, 80)} · ${SITE_LABELS[site]}`, value: account.handle.slice(0, 100)});
        }
      } catch(error) {
        // nothing more to offer, what's typed is still used
      }
    }
    return context.respond({choices: choices.slice(0, MAX_CHOICES)});
  };
}


// what every site's post is made of, null when there's nothing to post. each site's own formatter adds what only it has
export interface PostSettings {
  // a post that's only what the site's own formatter adds (a reddit post's title) isn't empty
  allowEmpty?: boolean,
  // a discord username as a handle on the site, when the site's handles can't have everything a username can
  discordHandle?: (username: string) => string,
  // the command's other texts that may hold mentions (the returned replacer writes those out as names)
  extraTexts?: Array<string>,
  // how the site dates a post shown inside another, `Mar 21` style when left out
  quoteTimestamp?: (time: moment.Moment) => string,
  // the site has no accounts to look up: text in `from` that isn't a mention is the name itself, shown as typed with
  // the site's blank avatar (nothing is sent as `account`)
  typedFrom?: boolean,
  // how the site writes a post's time: a moment format, or a function for the ones that write its age (`2h`).
  // `known` is false when nothing set the time (no `time`, no message it came from), for sites that make one up then
  timestamp: string | ((time: moment.Moment, known: boolean) => string),
}

export interface PostResult {
  // who it's from when that's a real account on the site, else the discord user it's from
  from: {account?: string, user?: Structures.Member | Structures.User},
  options: RestOptions.MediaICreatePost,
  // the message shown inside the post (it came with text beside it)
  quoted: null | Structures.Message,
  replaceMentions: (text: string, bare?: boolean) => string,
  // the message that is the post (it came by itself)
  source: null | Structures.Message,
  time: moment.Moment,
  timeKnown: boolean,
}

export async function createPostOptions(
  context: Command.Context | Interaction.InteractionContext,
  args: PostCommandArgs,
  settings: PostSettings,
): Promise<PostResult | null> {
  const discordHandle = settings.discordHandle || ((username: string) => username);
  const text = (args.text || '').trim();
  const message = args.message || null;
  // a message with nothing typed beside it is the post itself
  const source = (message && !text) ? message : null;
  const quoted = (message && text) ? message : null;

  const content = (source) ? source.content : text;
  const imageUrl = args.image || ((source) ? firstAttachmentImageUrl(source) : firstImageUrl(context));
  const quoteUrl = (args.quote || '').trim();
  if (quoteUrl && !realPostSite(quoteUrl)) {
    throw new UserError((await getTranslator(context)).translate('tools.postshot.unsupported'));
  }
  if (!content && !imageUrl && !quoted && !quoteUrl && !settings.allowEmpty) {
    return null;
  }
  const from = await resolveFrom(context, args.from);

  const replaceMentions = await createMentionsReplacer(context, [
    content,
    (quoted) ? quoted.content : '',
    args.name || '',
    ...(settings.extraTexts || []),
  ]);

  const location = {guildId: context.guildId, userId: context.userId};
  const timeKnown = !!(args.time || source);
  const time = createTimestampMomentFromContext((args.time) ? args.time.getTime() : ((source) ? source.createdAtUnix : Date.now()), location);

  const author: RestOptions.MediaICreatePostAuthor = {
    handle: (args.handle) ? cleanHandle(args.handle) : undefined,
    name: (args.name) ? replaceMentions(args.name, true).slice(0, MAX_NAME_LENGTH) : undefined,
    verified: args.verified || undefined,
  };
  if (from.account && settings.typedFrom) {
    // a name someone typed, on a site where there's nobody to look up
    const typed = replaceMentions(String(args.from || '').trim(), true).slice(0, MAX_NAME_LENGTH);
    author.name = author.name || typed;
    author.handle = author.handle || from.account;
    from.account = undefined;
  } else if (!from.account) {
    // a discord user: who `from` named, whose message it is, who the text started with, or whoever asked
    from.user = from.user || ((source) ? (source.member || source.author) : (args.user || context.member || context.user));
    const identity = postAuthor(from.user, discordHandle);
    author.avatarUrl = identity.avatarUrl;
    author.handle = author.handle || identity.handle;
    author.name = author.name || identity.name;
  }

  const options: RestOptions.MediaICreatePost = {
    account: from.account,
    author,
    content: replaceMentions(content).slice(0, MAX_TEXT_LENGTH),
    imageUrl,
    likes: args.likes,
    portraitUrl: args.portrait || undefined,
    // the api reads the real post, and writes its time in the timezone of whoever asked
    quoteUrl: quoteUrl || undefined,
    replyTo: (args.replyto) ? await replyHandle(context, args.replyto, discordHandle) : undefined,
    reposts: args.reposts,
    safe: DefaultParameters.safe(context),
    timestamp: (typeof(settings.timestamp) === 'string') ? time.format(settings.timestamp) : settings.timestamp(time, timeKnown),
  };
  if (quoteUrl) {
    options.timezone = getTimezoneFromContext(location);
  } else if (quoted) {
    const quotedTime = createTimestampMomentFromContext(quoted.createdAtUnix, location);
    options.quote = {
      author: postAuthor(quoted.member || quoted.author, discordHandle),
      content: replaceMentions(quoted.content).slice(0, MAX_QUOTE_LENGTH),
      imageUrl: firstAttachmentImageUrl(quoted),
      timestamp: (settings.quoteTimestamp || quoteDate)(quotedTime),
    };
  }
  return {from, options, quoted, replaceMentions, source, time, timeKnown};
}


// which site a link's post is on when it's one the api can read and draw (`postshot`, a quoted real post), else null.
// the same rule the api has: the sites by their hosts, and any other server whose link is shaped like a mastodon post's
const REAL_POST_HOSTS: Record<string, Array<string>> = {
  bluesky: ['bsky.app'],
  facebook: ['facebook.com', 'fb.watch', 'fb.com'],
  instagram: ['instagram.com'],
  reddit: ['reddit.com', 'redd.it'],
  threads: ['threads.net', 'threads.com'],
  truth: ['truthsocial.com'],
  x: ['x.com', 'twitter.com'],
};
const REGEX_STATUS_PATH = /^\/(?:@[A-Za-z0-9_.-]+(?:@[A-Za-z0-9.-]+)?(?:\/posts)?|users\/[A-Za-z0-9_.-]+\/statuses|web\/statuses)\/\d{5,25}\/?$/;
const REGEX_STATUS_HOST = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

export function realPostSite(value: string): null | string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch(error) {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  for (const site in REAL_POST_HOSTS) {
    if (REAL_POST_HOSTS[site].some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return (site !== 'truth' || REGEX_STATUS_PATH.test(url.pathname)) ? site : null;
    }
  }
  return (REGEX_STATUS_PATH.test(url.pathname) && REGEX_STATUS_HOST.test(host)) ? 'mastodon' : null;
}


// `from` is a discord user when it's their mention (typed, or picked from the suggestions), anything else is an
// account's handle on the site. plain text is never looked up as a discord name: a member and an account can share one
const REGEX_FROM_MENTION = /^<@!?(\d{15,21})>$/;

export async function resolveFrom(
  context: Command.Context | Interaction.InteractionContext,
  value?: null | string,
): Promise<{account?: string, user?: Structures.Member | Structures.User}> {
  const text = (value || '').trim();
  if (!text) {
    return {};
  }
  const mention = text.match(REGEX_FROM_MENTION);
  if (!mention) {
    return {account: cleanHandle(text)};
  }
  let user: null | Structures.Member | Structures.User = null;
  try {
    user = await fetchMemberOrUserById(context, mention[1]);
  } catch(error) {}
  if (!user) {
    const { translate } = await getTranslator(context);
    throw new UserError(translate('errors.user_not_found'));
  }
  return {user};
}


// a discord user as a post's author: their avatar, the name they show and their username as the handle
export function postAuthor(
  author: Structures.Member | Structures.User,
  discordHandle: (username: string) => string = (username) => username,
): RestOptions.MediaICreatePostAuthor {
  return {
    avatarUrl: author.avatarUrlFormat('png', {size: 128}),
    handle: discordHandle(author.username),
    name: author.name.slice(0, MAX_NAME_LENGTH),
  };
}


// a handle as typed, with or without its `@`, only what a handle can have in it
export function cleanHandle(value: string): string | undefined {
  const handle = value.trim().replace(/^@+/, '').replace(/\s+/g, '').slice(0, MAX_HANDLE_LENGTH);
  return handle || undefined;
}


// who the post replies to: a mentioned discord user's username, or the handle as typed
async function replyHandle(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
  discordHandle: (username: string) => string = (username) => username,
): Promise<string | undefined> {
  const match = value.trim().match(/^<@!?(\d{15,21})>$/);
  if (match) {
    try {
      const user = await fetchMemberOrUserById(context, match[1]);
      if (user) {
        return discordHandle(user.username);
      }
    } catch(error) {}
    return undefined;
  }
  const handle = cleanHandle(value);
  return (handle && REGEX_HANDLE.test(handle)) ? handle : undefined;
}


// how both sites date a post inside another: `Mar 21`, with the year once it's not this one
export function quoteDate(time: moment.Moment): string {
  const now = moment.tz(time.tz() || 'UTC');
  return time.format((time.isSame(now, 'year')) ? 'MMM D' : 'MMM D, YYYY');
}
