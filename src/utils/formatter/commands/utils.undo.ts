import { Command, Interaction } from 'detritus-client';

import { deleteCommandsResponses, fetchCommandsResponses } from '../../../api';
import { CommandTypes, StatusEmojis } from '../../../constants';
import CommandResponsesStore from '../../../stores/commandresponses';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';
import { queueDeleteOf, queueMessageDelete } from '../../messagedeletes';


export const COMMAND_ID = 'undo';

export const MAX_AMOUNT = 5;

export interface CommandArgs {
  amount: number,
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
  // response -> its trigger, a response that fails to delete keeps its trigger's api row so a later undo can retry it
  const responseTriggerIds = new Map<string, string>();
  for (let result of results) {
    if (amount <= triggerIds.length) {
      break;
    }
    if (result.message_trigger_id === currentTriggerId) {
      continue;
    }
    triggerIds.push(result.message_trigger_id);

    // with the other messages its run sent (the api may not have the newest ones yet)
    const responseIds = new Set([
      result.message_response_id,
      ...(result.extra_response_ids || []),
      ...CommandResponsesStore.takeExtraResponses(result.message_trigger_id),
    ]);
    for (let responseId of responseIds) {
      if (CommandResponsesStore.claimDeletion(responseId)) {
        messageIds.push(responseId);
        responseTriggerIds.set(responseId, result.message_trigger_id);
      }
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
    // with the rest below, the channel's delete queue sends them together
    queueDeleteOf(context.message).catch(() => null);
  }

  // through the channel's delete queue, which bulk deletes the ones under 14 days old together when we can (Manage
  // Messages) and the rest one at a time. a message that's already gone resolves, it was an `.undo` the trigger's own
  // delete (or an ephemeral response) got to first
  let failed = 0;
  const keptTriggerIds = new Set<string>();
  await Promise.all(messageIds.map(async (messageId) => {
    try {
      await queueMessageDelete(context.client, channelId, messageId);
    } catch(error) {
      failed++;
      // still there: unclaim it so another undo (or deleting its trigger) can try again
      const triggerId = responseTriggerIds.get(messageId);
      if (triggerId !== undefined) {
        CommandResponsesStore.releaseDeletion(messageId);
        keptTriggerIds.add(triggerId);
      }
    }
  }));

  const deletedTriggerIds = triggerIds.filter((triggerId) => !keptTriggerIds.has(triggerId));
  if (deletedTriggerIds.length) {
    try {
      await deleteCommandsResponses(context, {channelId, triggerIds: deletedTriggerIds});
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
  setTimeout(() => {
    if (message && !message.deleted) {
      queueDeleteOf(message).catch(() => null);
    }
  }, 1000);
}
