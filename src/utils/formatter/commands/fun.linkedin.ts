import { Command, Interaction } from 'detritus-client';
import moment from 'moment';

import { mediaICreateLinkedin } from '../../../api';
import { RestOptions } from '../../../api/types';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.linkedin';

export const THEMES = ['light', 'dark'] as const;
// how far the author is from whoever looks at the feed (`• 2nd` after the name), a 1st has no Follow link
export const DEGREES = ['1st', '2nd', '3rd', 'none'] as const;
export const DEGREE_ALIASES: Record<string, RestOptions.MediaICreateLinkedinDegree> = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '3rd+': '3rd',
  first: '1st',
  no: 'none',
  off: 'none',
  second: '2nd',
  third: '3rd',
};
// linkedin's own limit on a headline
export const MAX_HEADLINE_LENGTH = 220;

// a linkedin post as the feed shows its card. there are no accounts to look up there and no handles: `from` is a
// mention or a name typed as is. under the name is a headline, what they do and where, and whoever has none set gets
// one made up for them
export interface CommandArgs extends Omit<PostCommandArgs, 'handle' | 'replyto'> {
  comments?: null | number,
  degree?: null | RestOptions.MediaICreateLinkedinDegree,
  headline?: null | string,
  // `old` is the card from before its one bar: a line of counts over labelled Like, Comment, Repost and Send buttons
  layout?: null | RestOptions.MediaICreatePostLayout,
  theme?: null | RestOptions.MediaICreateLinkedin['theme'],
}

// what a made up headline is put together from: `{title} at {place}` or `{title} | {tag}`, never all three: the card
// gives the headline one line of about 50 characters beside Follow, and the tag is the punchline that got cut off
export const JOB_TITLES = [
  'Senior Thought Leader',
  'Chief Vibes Officer',
  'Fractional CEO',
  'Head of Disruption',
  'Synergy Architect',
  'Growth Ninja',
  'VP of Alignment',
  'Visionary in Residence',
  'Director of Hustle',
  'Serial Founder',
];
export const JOB_PLACES = [
  'Stealth Startup',
  'Self-Employed',
  'Grindset Inc.',
  'Pivot Labs',
  'Hustle & Co.',
  'Open to Work',
];
export const JOB_TAGS = [
  'Building in public',
  '10x Mindset',
  'TEDx speaker (pending)',
  '30 Under 30 (pending)',
  'Ex-Intern',
  'Coffee enthusiast',
  'Keynote listener',
  'Dog dad',
];
// about this many of them have a place where the rest have a tag
const NO_TAG_CHANCE = 1 / 3;

// a number from a name that's the same every time (fnv-1a), then numbers from 0 to 1 off it (mulberry32)
function seededRandom(seed: string): () => number {
  let state = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 0x01000193);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// the job someone gets when they have no headline: picked by their name, so they keep the same one every time
export function madeUpHeadline(name: string): string {
  const random = seededRandom(name.trim().toLowerCase());
  const pick = (values: Array<string>) => values[Math.floor(random() * values.length)];
  const title = pick(JOB_TITLES);
  const place = pick(JOB_PLACES);
  const tag = pick(JOB_TAGS);
  return (random() < NO_TAG_CHANCE) ? `${title} at ${place}` : `${title} | ${tag}`;
}

// how the feed writes a post's age: `now`, `26m`, `3h`, `6d`, `2w`, `3mo`, `1yr` (the api writes the ones it makes up
// the same way)
export function postAge(time: moment.Moment | number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - time.valueOf()) / 1000));
  const days = Math.floor(seconds / 86400);
  if (seconds < 60) {
    return 'now';
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  } else if (days < 7) {
    return `${days}d`;
  } else if (days < 30) {
    return `${Math.floor(days / 7)}w`;
  } else if (days < 365) {
    return `${Math.min(Math.floor(days / 30), 11)}mo`;
  }
  return `${Math.floor(days / 365)}yr`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const typedHeadline = (args.headline || '').replace(/\s+/g, ' ').trim();
  const post = await createPostOptions(context, args, {
    extraTexts: [typedHeadline],
    quoteTimestamp: (time) => postAge(time),
    // with no time known the api makes up an age that fits the reactions
    timestamp: (time, known) => (known) ? postAge(time) : '',
    typedFrom: true,
  });
  if (!post) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }
  const options = post.options;
  const author = options.author || {};
  options.author = author;
  // never drawn (nobody has a handle there), the api's posts all have one
  author.handle = author.handle || (context.member || context.user).username;

  // a name that was typed (`name`, or `from` when it isn't a mention) picks the job, else the discord username does
  const user = post.from.user;
  const identity = (args.name || !user) ? (author.name || '') : user.username;
  const quoted = (options.quote) ? post.quoted : null;

  const response = await mediaICreateLinkedin(context, {
    ...options,
    comments: args.comments,
    degree: args.degree || '2nd',
    layout: args.layout || 'new',
    headline: ((typedHeadline) ? post.replaceMentions(typedHeadline, true) : madeUpHeadline(identity)).slice(0, MAX_HEADLINE_LENGTH),
    // whoever's message is shown inside the post has a job too
    quoteHeadline: (quoted) ? madeUpHeadline(quoted.author.username) : undefined,
    theme: args.theme || 'light',
  });
  return mediaReply(context, response, {filename: 'linkedin'});
}
