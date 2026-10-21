import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { Permissions } from 'detritus-client/lib/constants';

import ServerExecutionsStore from '../../../stores/serverexecutions';
import { Translator, getTranslator } from '../../i18n';

import { mediaICreateWordcloud, mediaICreateWordcloudBackground } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { displayDetailsLine, displayReply, jobReply } from '../../../utils';


export const MAX_FETCHES = 10;

// per message, so one long message (or spam) can't fill the whole cloud
export const MAX_WORDS_PER_MESSAGE = 50;
export const MAX_WORD_LENGTH = 50;
export const TOP_WORDS_SHOWN = 8;

export const COMMAND_ID = 'media.i.create.wordcloud.channel';

export interface CommandArgs {
  before?: string,
  // include messages from bots (webhooks are always included, they're often people through a proxy bot)
  bots?: boolean,
  channel?: Structures.Channel,
  // words to leave out, split by commas or spaces
  exclude?: string,
  // the words fill this image's shape and take its colors
  image?: string,
  max?: number,
  shape?: string,
  theme?: string,
}

// mentions, channels, custom emojis, slash command mentions, timestamps and links would end up as words
const DISCORD_MARKUP_REGEX = /<(?:@[!&]?\d+|#\d+|a?:\w+:\d+|\/[^<>:]+:\d+|t:-?\d+(?::[a-zA-Z])?|id:\w+)>|https?:\/\/\S+/g;

// `user` only uses that user's messages (used by `wordcloud user`)
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  user?: Structures.User,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const channel = args.channel;
  if (channel) {
    const member = context.member;
    if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
      return displayReply(context, {description: translate('media_i_create_wordcloud_channel.you_cannot_view_the_history_of_that')});
    }
    if (!channel.canReadHistory) {
      return displayReply(context, {description: translate('media_i_create_wordcloud_channel.cannot_view_the_history_of_that_channel')});
    }
  }

  const isExecuting = ServerExecutionsStore.getOrCreate(context.guildId || context.channelId!);
  if (isExecuting.wordcloud) {
    return displayReply(context, {description: translate('media_i_create_wordcloud_channel.already_generating_a_wordcloud_in_this_server')});
  }

  // only held while fetching, that's the part that hammers discord (up to 10 history requests), rendering is a job
  isExecuting.wordcloud = true;
  let words: Array<string>;
  try {
    words = await fetchMessages(context, args, user);
  } finally {
    isExecuting.wordcloud = false;
  }
  if (!words.length) {
    return displayReply(context, {description: translate('media_i_create_wordcloud_channel.no_messages_found')});
  }

  const options = {
    exclude: (args.exclude) ? args.exclude.split(/[\s,]+/).filter(Boolean).slice(0, 200) : undefined,
    shape: args.shape,
    theme: args.theme,
    words,
  };
  const job = (args.image) ?
    await mediaICreateWordcloudBackground(context, {...options, url: args.image}) :
    await mediaICreateWordcloud(context, options);
  return await jobReply(context, job, {describe: (response) => describeTopWords(response, language, translate)});
}


// the most used words (`word 142 • other 97`) and how many there were, from the job's `arguments`
export function describeTopWords(
  response: RestResponsesRaw.FileResponse,
  language: string,
  translate: Translator['translate'],
): string | undefined {
  const details = response.arguments;
  if (!details || !Array.isArray(details.top_words) || !details.top_words.length) {
    return undefined;
  }
  const words = (details.top_words as Array<{count: number, word: string}>).slice(0, TOP_WORDS_SHOWN);
  const top = displayDetailsLine(words.map((x) => `${Markup.escape.all(x.word)} **${x.count.toLocaleString(language)}**`));
  const counts = displayDetailsLine([
    (details.total_words) ? translate('media_i_create_wordcloud_channel.total_words', {count: Number(details.total_words).toLocaleString(language)}) : null,
    (details.unique_words) ? translate('media_i_create_wordcloud_channel.unique_words', {count: Number(details.unique_words).toLocaleString(language)}) : null,
  ], true);
  return [top, counts].filter(Boolean).join('\n');
}


// one text per message, discord markup and links removed, each line kept on its own line
export function cleanMessageContent(content: string): string {
  let amount = 0;
  const lines: Array<string> = [];
  for (let line of content.replace(DISCORD_MARKUP_REGEX, ' ').split('\n')) {
    const words = line.split(/\s+/).filter((x) => x && x.length <= MAX_WORD_LENGTH).slice(0, MAX_WORDS_PER_MESSAGE - amount);
    amount += words.length;
    if (words.length) {
      lines.push(words.join(' '));
    }
    if (MAX_WORDS_PER_MESSAGE <= amount) {
      break;
    }
  }
  return lines.join('\n');
}


export async function fetchMessages(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
  user?: Structures.User,
): Promise<Array<string>> {
  const channelId = (args.channel) ? args.channel.id : context.channelId!;
  const limit = args.max || 500;

  let before: string | undefined;
  if (args.before) {
    before = args.before;
  } else {
    if (context instanceof Command.Context) {
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId && messageReference.channelId === channelId) {
        before = String(BigInt(messageReference.messageId) + 1n);
      } else {
        before = context.messageId;
      }
    }
  }

  // cached messages can be newer than the starting cursor (reply/before), skip those
  let startBefore: bigint | null = null;
  if (before) {
    try {
      startBefore = BigInt(before);
    } catch(error) {
      startBefore = null;
    }
  }

  // one per message that has words left after cleaning, those are what `max` counts
  const texts: Array<string> = [];
  if (args.channel) {
    for (let message of args.channel.messages.toArray().reverse()) {
      if (limit <= texts.length) {
        break;
      }
      if (startBefore !== null && startBefore <= BigInt(message.id)) {
        continue;
      }
      // advance the cursor even for skipped messages so the next fetch doesn't overlap and double count
      before = message.id;
      if (context instanceof Command.Context && message.id === context.messageId) {
        continue;
      }
      const text = getMessageText(message, args, user);
      if (text) {
        texts.push(text);
      }
    }
  }

  let tries = 0;
  while (tries++ < MAX_FETCHES && texts.length < limit) {
    const messages = (await context.rest.fetchMessages(channelId, {before, limit: 100})).toArray();
    if (!messages.length) {
      // reached the start of the channel
      break;
    }
    // advance the cursor from the oldest fetched message regardless of whether it gets skipped
    before = messages.reduce((oldest, message) => (BigInt(message.id) < BigInt(oldest)) ? message.id : oldest, messages[0].id);
    for (let message of messages) {
      if (limit <= texts.length) {
        break;
      }
      const text = getMessageText(message, args, user);
      if (text) {
        texts.push(text);
      }
    }
    if (messages.length < 100) {
      break;
    }
  }

  return texts;
}


// empty when the message is skipped (another user's, a bot's or only links/markup)
function getMessageText(message: Structures.Message, args: CommandArgs, user?: Structures.User): string {
  if (user && message.author.id !== user.id) {
    return '';
  }
  if (!args.bots && message.fromBot && !message.fromWebhook) {
    return '';
  }
  return (message.content) ? cleanMessageContent(message.content) : '';
}
