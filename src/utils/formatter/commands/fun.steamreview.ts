import { Command, Interaction } from 'detritus-client';
import moment from 'moment';
import 'moment-timezone';

import { mediaICreatePostGames, mediaICreateSteamReview } from '../../../api';
import { displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { PostCommandArgs, createPostOptions } from './fun.tweet';


export const COMMAND_ID = 'fun.steamreview';

// a game's name, its app id or its store link (what the api takes)
export const MAX_GAME_LENGTH = 200;
// a profile's link, longer than any handle
export const MAX_FROM_LENGTH = 200;

// a steam review: like the posts it's from whoever used the command unless `from` says otherwise (a @mention, or a real
// steam profile by its custom url or id), but a review is only text. it has no image, no reply and no quoted post
export interface CommandArgs extends Pick<PostCommandArgs, 'from' | 'message' | 'name' | 'portrait' | 'text' | 'time' | 'user'> {
  // the `Early Access Review` tag
  early?: null | boolean,
  // the `Product received for free` line
  free?: null | boolean,
  funny?: null | number,
  // a game's name (looked up, a made up one is kept as typed), its app id or its store link
  game?: null | string,
  helpful?: null | number,
  hours?: null | number,
  products?: null | number,
  // thumbs up unless it's false
  recommended?: null | boolean,
  reviews?: null | number,
  // the hours at review time, shown after the hours on record
  reviewtime?: null | number,
}

// how the store dates a review: `Today`, `Yesterday`, `November 23`, with the year once it's not this one (the image
// writes it in capitals like the store does)
export function postedDate(time: moment.Moment): string {
  const now = moment.tz(time.tz() || 'UTC');
  if (time.isSame(now, 'day')) {
    return 'Today';
  }
  if (time.isSame(now.clone().subtract(1, 'day'), 'day')) {
    return 'Yesterday';
  }
  return time.format((time.isSame(now, 'year')) ? 'MMMM D' : 'MMMM D, YYYY');
}

// a profile's link is the profile: `steamcommunity.com/id/name` is `name`, `/profiles/7656...` the id
const REGEX_PROFILE_LINK = /steamcommunity\.com\/(?:id|profiles)\/([^\/?#\s]+)/i;

export function profileFromLink(value: string): string {
  const match = value.match(REGEX_PROFILE_LINK);
  return (match) ? match[1] : value;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const text = (args.text || '').trim();
  const post = await createPostOptions(context, {
    from: (args.from) ? profileFromLink(args.from) : args.from,
    // steam has nothing to show a quoted message in: with text beside it the message is left out and the review is
    // the text, by whoever asked. by itself the message is the review, by its author
    message: (text) ? null : args.message,
    name: args.name,
    portrait: args.portrait,
    text,
    time: args.time,
    user: args.user,
  }, {timestamp: postedDate});
  // an image alone (attached, or the message's) isn't a review
  if (!post || !post.options.content) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.post.nothing_to_post')});
  }

  const game = (args.game || '').trim().slice(0, MAX_GAME_LENGTH);
  const response = await mediaICreateSteamReview(context, {
    ...post.options,
    earlyAccess: !!args.early,
    funny: args.funny,
    game: game || undefined,
    helpful: args.helpful,
    hours: args.hours,
    hoursAtReview: args.reviewtime,
    imageUrl: undefined,
    products: args.products,
    receivedFree: !!args.free,
    recommended: args.recommended !== false,
    reviews: args.reviews,
  });
  return mediaReply(context, response, {filename: 'steam-review'});
}


// `game`'s suggestions while a name is typed: steam's own matches (the api keeps them a day per start of a name). a
// choice is the game's app id, so the one picked is exactly that game. anything else typed still works: it's searched
// for when the command runs, and a game steam doesn't have keeps the name as typed
const MAX_CHOICES = 25;
const MAX_QUERY_LENGTH = 100;

export async function autocompleteGame(context: Interaction.InteractionAutoCompleteContext) {
  const typed = (context.value || '').trim();
  const choices: Array<{name: string, value: string}> = [];
  if (typed) {
    try {
      const { games } = await mediaICreatePostGames(context, {query: typed.slice(0, MAX_QUERY_LENGTH)});
      for (let game of games) {
        choices.push({name: game.name.slice(0, 100), value: game.id});
      }
    } catch(error) {
      // nothing to offer, what's typed is still used
    }
  }
  return context.respond({choices: choices.slice(0, MAX_CHOICES)});
}
