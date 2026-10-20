import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import ServerExecutionsStore from '../../../stores/serverexecutions';
import { getTranslator } from '../../i18n';

import { mediaICreateWordcloud } from '../../../api';
import { displayReply, jobReply } from '../../../utils';


export const MAX_FETCHES = 10;

export const COMMAND_ID = 'media.i.create.wordcloud.channel';

export interface CommandArgs {
  before?: string,
  channel?: Structures.Channel,
  max?: number,
}

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

  isExecuting.wordcloud = true;
  try {
    const words = await fetchMessages(context, args, user).then((x) => x.slice(0, 3000));
    const job = await mediaICreateWordcloud(context, {words});
    return await jobReply(context, job);
  } finally {
    isExecuting.wordcloud = false;
  }
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

  const messagesFound: Array<Structures.Message> = [];
  if (args.channel) {
    for (let message of args.channel.messages.toArray().reverse()) {
      if (limit <= messagesFound.length) {
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
      if (message.embeds.length === 1 && message.embeds.first()!.url === message.content) {
        continue;
      }
      if (!user || message.author.id === user.id) {
        messagesFound.push(message);
      }
    }
  }

  let tries = 0;
  while (tries++ < MAX_FETCHES && messagesFound.length < limit) {
    const messages = (await context.rest.fetchMessages(channelId, {before, limit: 100})).toArray();
    if (!messages.length) {
      // reached the start of the channel
      break;
    }
    // advance the cursor from the oldest fetched message regardless of whether it gets skipped
    before = messages.reduce((oldest, message) => (BigInt(message.id) < BigInt(oldest)) ? message.id : oldest, messages[0].id);
    for (let message of messages) {
      if (limit <= messagesFound.length) {
        break;
      }
      if (message.embeds.length === 1 && message.embeds.first()!.url === message.content) {
        continue;
      }
      if (!user || message.author.id === user.id) {
        messagesFound.push(message);
      }
    }
    if (messages.length < 100) {
      break;
    }
  }

  if (!messagesFound.length) {
    return ['no', 'messages', 'found', 'rip'];
  }

  const words: Array<string> = [];
  for (let message of messagesFound) {
    if (message.content) {
      const text = message.content.split(' ').map((x) => x.trim()).filter((x) => x && x.length <= 50).slice(0, 30);
      for (let word of text) {
        words.push(word);
      }
    }
  }
  return words;
}
