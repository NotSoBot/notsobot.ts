import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Snowflake } from 'detritus-utils';

import { StatusEmojis } from '../../../constants';
import { getTranslator } from '../../i18n';
import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'undo';

export const MAX_AMOUNT = 5;

// discord refuses to bulk delete messages older than 14 days
export const BULK_DELETE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

export interface CommandArgs {
  amount: number,
}

interface UndoGroup {
  fromInteraction: boolean,
  ids: Array<string>,
  newestId: bigint,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { channelId } = context;
  if (!channelId) {
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('utils_undo.unable_to_undo_commands_here')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  const amount = Math.max(1, Math.min(args.amount || 1, MAX_AMOUNT));
  const groups: Array<UndoGroup> = [];

  if (context.commandClient) {
    // get the user's last prefixed commands (their message and our reply)
    let found = 0;
    for (let {context: lastContext, reply: lastReply} of context.commandClient.replies.toArray().reverse()) {
      if (amount <= found) {
        break;
      }
      if (lastContext.channelId !== channelId || lastContext.userId !== context.userId) {
        continue;
      }
      if (!lastReply.canDelete || lastReply.deleted) {
        continue;
      }
      const ids = [lastReply.id];
      if (lastContext.message.canDelete && !lastContext.message.deleted) {
        ids.push(lastContext.message.id);
      }
      groups.push({fromInteraction: false, ids, newestId: BigInt(lastReply.id)});
      found++;
    }
  }

  {
    // get the user's last interaction commands (our responses)
    let found = 0;
    for (let message of context.messages.filter((x) => x.channelId === channelId).reverse()) {
      if (amount <= found) {
        break;
      }
      if (message.deleted || !message.fromMe) {
        continue;
      }
      const interaction = message.interactionMetadata || message.interaction;
      if (!interaction || interaction.user.id !== context.userId) {
        continue;
      }
      if (context instanceof Interaction.InteractionContext && interaction.id === context.interactionId) {
        // this is the response to the current undo command
        continue;
      }
      groups.push({fromInteraction: true, ids: [message.id], newestId: BigInt(message.id)});
      found++;
    }
  }

  if (context instanceof Command.Context && context.message.canDelete && !context.message.deleted) {
    try {
      await context.message.delete();
    } catch(error) {

    }
  }

  const count = {interactions: 0, prefixed: 0};
  const messageIds: Array<string> = [];
  {
    const newestFirst = groups.sort((x, y) => {
      if (x.newestId === y.newestId) {
        return 0;
      }
      return (x.newestId < y.newestId) ? 1 : -1;
    });
    for (let group of newestFirst.slice(0, amount)) {
      if (group.fromInteraction) {
        count.interactions++;
      } else {
        count.prefixed++;
      }
      messageIds.push(...group.ids);
    }
  }

  let failed = 0;
  if (messageIds.length) {
    let singleIds = messageIds;

    const { channel } = context;
    if (!context.inDm && channel && channel.canManageMessages) {
      const minimumTimestamp = Date.now() - BULK_DELETE_MAX_AGE;
      const bulkIds = messageIds.filter((messageId) => minimumTimestamp < Snowflake.timestamp(messageId));
      if (2 <= bulkIds.length) {
        try {
          await context.rest.bulkDeleteMessages(channelId, bulkIds);
          singleIds = messageIds.filter((messageId) => !bulkIds.includes(messageId));
        } catch(error) {
          // fall back to deleting them one by one
        }
      }
    }

    for (let messageId of singleIds) {
      try {
        await context.rest.deleteMessage(channelId, messageId);
      } catch(error) {
        failed++;
      }
    }
  }

  let text: string;
  if (!messageIds.length) {
    text = translate('utils_undo.could_not_find_any_of_your_last');
  } else if (count.interactions && count.prefixed) {
    text = translate('utils_undo.successfully_deleted_interactions_and_commands', {interactions: count.interactions, prefixed: count.prefixed});
  } else if (count.interactions) {
    text = translate('utils_undo.successfully_deleted_interactions', {interactions: count.interactions});
  } else {
    text = translate('utils_undo.successfully_deleted_commands', {prefixed: count.prefixed});
  }
  if (failed) {
    text = translate('utils_undo.messages_could_not_be_deleted', {failed: failed.toLocaleString(language), text: text});
  }

  if (context instanceof Interaction.InteractionContext) {
    return editOrReply(context, {content: text, flags: MessageFlags.EPHEMERAL});
  }

  const message = await editOrReply(context, text);
  setTimeout(async () => {
    try {
      if (!message.deleted) {
        await message.delete();
      }
    } catch(error) {

    }
  }, 1000);
}
