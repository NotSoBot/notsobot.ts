import { Command, Interaction, Structures } from 'detritus-client';

import { mediaICreateTwitch } from '../../../api';
import { RestOptions } from '../../../api/types';
import { DefaultParameters, createTimestampMomentFromContext, displayReply, mediaReply } from '../../../utils';
import { getTranslator } from '../../i18n';

import { createMentionsReplacer } from './fun.quote';
import { resolveFrom } from './fun.tweet';


export const COMMAND_ID = 'fun.twitch';

// twitch's own limit on a chat message, the api's too
export const MAX_TEXT_LENGTH = 500;
export const MAX_NAME_LENGTH = 50;
// a twitch login is 25 at most, with room for the `@`
export const MAX_FROM_LENGTH = 26;
export const MAX_COLOR_LENGTH = 32;

// the badges before a name, in the order the chat puts them
export const BADGES = ['broadcaster', 'staff', 'mod', 'vip', 'sub', 'partner', 'prime', 'turbo', 'bits'] as const;
export const BADGE_ALIASES: Record<string, RestOptions.MediaICreateTwitchBadge> = {
  moderator: 'mod',
  streamer: 'broadcaster',
  subscriber: 'sub',
  verified: 'partner',
};
export const MAX_BADGES = 5;
// how the chat marks a message: bought with channel points, or someone's first one in the channel
export const STYLES = ['highlight', 'first'] as const;
export const THEMES = ['dark', 'light'] as const;

// how the chat writes a message's time when it's turned on
const TIMESTAMP_FORMAT = 'h:mm';

// one twitch chat message. not a post: there's no image, handle or counts, only who said it (their badges and the color
// of their name) and what they said. emote names in the text are drawn by the api
export interface CommandArgs {
  // none of them for an empty list. left out, a real account that's a partner gets that badge
  badges?: null | Array<RestOptions.MediaICreateTwitchBadge>,
  // the name's color: a color name, `#hex` or `r,g,b`
  color?: null | string,
  // who it's from: a discord user's mention, or a real twitch account's login (its name, color and partner badge)
  from?: null | string,
  // a real message: by itself it's the chat message (by its author), with `text` it's what the text replies to
  message?: null | Structures.Message,
  name?: null | string,
  style?: null | typeof STYLES[number],
  text?: null | string,
  theme?: null | RestOptions.MediaICreateTwitch['theme'],
  // only drawn when it's given, the chat hides the time unless it's turned on
  time?: null | Date,
  // the prefixed command's `@user text` shortcut, `from` goes over it
  user?: null | Structures.Member | Structures.User,
}

// chat has no newlines, a message's are spaces there
export function oneLine(text: string): string {
  return text.split(/\s+/).filter(Boolean).join(' ');
}

export async function createOptions(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
): Promise<RestOptions.MediaICreateTwitch | null> {
  const text = (args.text || '').trim();
  const message = args.message || null;
  // a message with nothing typed beside it is the chat message itself, with text it's the one replied to
  const source = (message && !text) ? message : null;
  const replied = (message && text) ? message : null;

  const raw = (source) ? source.content : text;
  // an image by itself is nothing a chat line can show
  if (!oneLine(raw)) {
    return null;
  }
  const from = await resolveFrom(context, args.from);
  const replaceMentions = await createMentionsReplacer(context, [raw, (replied) ? replied.content : '', args.name || '']);

  let name: string | undefined = (args.name) ? replaceMentions(args.name, true).slice(0, MAX_NAME_LENGTH) : undefined;
  if (!from.account && !name) {
    // a discord user: who `from` named, whose message it is, who the text started with, or whoever asked
    const user = from.user || ((source) ? (source.member || source.author) : (args.user || context.member || context.user));
    name = user.name.slice(0, MAX_NAME_LENGTH);
  }

  const options: RestOptions.MediaICreateTwitch = {
    account: from.account,
    badges: args.badges || undefined,
    content: oneLine(replaceMentions(raw)).slice(0, MAX_TEXT_LENGTH),
    name,
    nameColor: args.color || undefined,
    safe: DefaultParameters.safe(context),
    style: args.style || undefined,
    theme: args.theme || 'dark',
  };
  if (args.time) {
    const time = createTimestampMomentFromContext(args.time.getTime(), {guildId: context.guildId, userId: context.userId});
    options.timestamp = time.format(TIMESTAMP_FORMAT);
  }
  if (replied) {
    const content = oneLine(replaceMentions(replied.content)).slice(0, MAX_TEXT_LENGTH);
    // a replied to message with only an image has no line to show
    if (content) {
      options.reply = {content, name: (replied.member || replied.author).name.slice(0, MAX_NAME_LENGTH)};
    }
  }
  return options;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const options = await createOptions(context, args);
  if (!options) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('fun.quote.nothing_to_quote')});
  }
  const response = await mediaICreateTwitch(context, options);
  return mediaReply(context, response, {filename: 'twitch'});
}
