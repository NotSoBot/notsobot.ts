import { Command, Interaction } from 'detritus-client';
import { Snowflake } from 'detritus-utils';

import { deleteCommandsResponses, fetchCommandsResponses } from '../../../api';
import { CommandTypes, StatusEmojis } from '../../../constants';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'undo';

export const MAX_AMOUNT = 5;

// discord refuses to bulk delete messages older than 14 days
export const BULK_DELETE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

export interface CommandArgs {
  amount: number,
}

// discord's error for a message that doesn't exist anymore
const ERROR_CODE_UNKNOWN_MESSAGE = 10008;

function isUnknownMessageError(error: any): boolean {
  return !!error && !!error.response && (error.response.statusCode === 404 || error.code === ERROR_CODE_UNKNOWN_MESSAGE);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { channelId } = context;
  if (!channelId) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('utils_undo.unable_to_undo_commands_here')}`, ephemeral: true});
  }

  const amount = Math.max(1, Math.min(args.amount || 1, MAX_AMOUNT));
  // this command's own trigger, its response isn't stored yet but skip it just in case
  const currentTriggerId = (context instanceof Interaction.InteractionContext) ? context.interactionId : context.messageId;

  // the user's last command responses in this channel (prefixed and interactions), newest first
  const { results } = await fetchCommandsResponses(context, {
    channelId,
    limit: amount + 1,
    userId: context.userId,
  });

  const { channel } = context;
  const canDeleteTriggers = !context.inDm && !!channel && channel.canManageMessages;

  const count = {interactions: 0, prefixed: 0};
  const messageIds: Array<string> = [];
  const triggerIds: Array<string> = [];
  for (let result of results) {
    if (amount <= triggerIds.length) {
      break;
    }
    if (result.message_trigger_id === currentTriggerId) {
      continue;
    }
    triggerIds.push(result.message_trigger_id);

    const response = context.messages.get(result.message_response_id);
    if (!response || !response.deleted) {
      messageIds.push(result.message_response_id);
    }
    if (result.message_trigger_type === CommandTypes.PREFIXED) {
      count.prefixed++;
      // the user's own command message, only deletable with manage messages
      if (canDeleteTriggers) {
        messageIds.push(result.message_trigger_id);
      }
    } else {
      count.interactions++;
    }
  }

  if (context instanceof Command.Context && context.message.canDelete && !context.message.deleted) {
    try {
      await context.message.delete();
    } catch(error) {

    }
  }

  let failed = 0;
  if (messageIds.length) {
    let singleIds = messageIds;

    if (canDeleteTriggers) {
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
        // already deleted (or an ephemeral response) is fine
        if (!isUnknownMessageError(error)) {
          failed++;
        }
      }
    }
  }

  if (triggerIds.length) {
    try {
      await deleteCommandsResponses(context, {channelId, triggerIds});
    } catch(error) {
      // the stale cleanup will get them eventually
    }
  }

  let text: string;
  if (!triggerIds.length) {
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
    return displayReply(context, {description: text, ephemeral: true});
  }

  const message = await displayReply(context, {description: text});
  setTimeout(async () => {
    try {
      if (message && !message.deleted) {
        await message.delete();
      }
    } catch(error) {

    }
  }, 1000);
}
