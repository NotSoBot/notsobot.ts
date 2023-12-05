import { Command, Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { mediaICreateWordcloud } from '../../../api';
import ServerExecutionsStore from '../../../stores/serverexecutions';
import { editOrReply, imageReply } from '../../../utils';


export const MAX_FETCHES = 10;

export const COMMAND_ID = 'media.i.create.wordcloud.channel';

export interface CommandArgs {
  before?: string,
  channel?: Structures.Channel,
  max?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const channel = args.channel;
  if (channel) {
    const member = context.member;
    if (member && !channel.can([Permissions.VIEW_CHANNEL, Permissions.READ_MESSAGE_HISTORY], member)) {
      return editOrReply(context, 'You cannot view the history of that channel');
    }
    if (!channel.canReadHistory) {
      return editOrReply(context, 'Cannot view the history of that channel');
    }
  }

  const isExecuting = ServerExecutionsStore.getOrCreate(context.guildId || context.channelId!);
  if (isExecuting.wordcloud) {
    return editOrReply(context, 'Already generating a wordcloud in this server');
  }

  isExecuting.wordcloud = true;
  try {
    const words = await fetchMessages(context, args).then((x) => x.slice(0, 3000));
    const response = await mediaICreateWordcloud(context, {words});
    isExecuting.wordcloud = false;
    return imageReply(context, response);
  } catch(error) {
    isExecuting.wordcloud = false;
    throw error;
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

  const messagesFound: Array<Structures.Message> = [];
  if (args.channel) {
    for (let message of args.channel.messages.toArray().reverse()) {
      if (context instanceof Command.Context && message.id === context.messageId) {
        continue;
      }
      if (message.embeds.length === 1 && message.embeds.first()!.url === message.content) {
        continue;
      }
      if (limit <= messagesFound.length) {
        break;
      }
      if (!user || message.author.id === user.id) {
        messagesFound.push(message);
      }
      before = message.id;
    }
  }

  let tries = 0;
  while (tries++ < MAX_FETCHES && messagesFound.length < limit) {
    const messages = await context.rest.fetchMessages(channelId, {before, limit: 100});
    for (let message of messages.toArray()) {
      if (limit <= messagesFound.length) {
        break;
      }
      if (message.embeds.length === 1 && message.embeds.first()!.url === message.content) {
        continue;
      }
      if (!user || message.author.id === user.id) {
        messagesFound.push(message);
      }
      before = message.id;
    }
  }

  if (!messagesFound.length) {
    return ['no', 'messages', 'found', 'rip'];
  }

  const words: Array<string> = [];
  for (let message of messagesFound) {
    if (message.content) {
      const text = message.content.split(' ').map((x) => x.trim()).filter((x) => x).slice(0, 30);
      for (let word of text) {
        words.push(word);
      }
    }
  }
  return words;
}
