import { Command, Interaction, Structures } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';

import { MAX_MESSAGES_BEFORE_CONFIRMATION, createMessage as createPruneMessage } from './moderation.prune';


export const COMMAND_ID = 'moderation.clean';

export const MAX_AMOUNT = 100;

export interface CommandArgs {
  amount: number,
}


// mention prefixes plus the server's custom prefixes (or the defaults)
export async function getCommandPrefixes(
  context: Command.Context | Interaction.InteractionContext,
): Promise<Array<string>> {
  const { commandClient } = context;
  if (!commandClient) {
    return [];
  }
  const prefixes: Array<string> = Array.from(commandClient.prefixes.mention);
  const settings = (context.guildId) ? await GuildSettingsStore.getOrFetch(context, context.guildId) : null;
  if (settings && settings.prefixes.length) {
    prefixes.push(...settings.prefixes.map(({prefix}) => prefix));
  } else {
    prefixes.push(...commandClient.prefixes.custom);
  }
  return prefixes.map((prefix) => prefix.toLowerCase()).filter((prefix) => !!prefix);
}

// whether this text starts with one of our prefixes followed by an actual command name (so `...lol` isn't one with a `.` prefix)
export function isCommandContent(
  context: Command.Context | Interaction.InteractionContext,
  prefixes: Array<string>,
  content: string,
): boolean {
  const { commandClient } = context;
  if (!commandClient) {
    return false;
  }
  const insensitive = content.trim().toLowerCase();
  for (let prefix of prefixes) {
    if (insensitive.startsWith(prefix)) {
      const rest = insensitive.slice(prefix.length).trim();
      if (rest && commandClient.commands.some((command) => !!command.getName(rest))) {
        return true;
      }
    }
  }
  return false;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const prefixes = await getCommandPrefixes(context);
  const userId = context.client.userId;
  const applicationId = context.applicationId;

  return createPruneMessage(context, {amount: args.amount}, {
    // `amount` is how many command uses to delete, each with all of its messages
    group: (message: Structures.Message) => getExecutionId(context, message),
    partialKey: 'prune.found_partial_commands',
    skipConfirmationUpTo: MAX_MESSAGES_BEFORE_CONFIRMATION,
    filter: (message: Structures.Message) => {
      // our replies, including slash command/context menu/component responses
      if (message.author.id === userId) {
        return true;
      }
      // interaction followups come through our application's webhook
      if (message.webhookId && message.webhookId === applicationId) {
        return true;
      }
      // messages that invoked one of our prefixed commands (only deletable with Manage Messages)
      if (!message.author.bot && isCommandContent(context, prefixes, message.content)) {
        return true;
      }
      return false;
    },
  });
}


// the id of the command message or interaction this message is part of, which is always the oldest message of the use
export function getExecutionId(
  context: Command.Context | Interaction.InteractionContext,
  message: Structures.Message,
): string {
  if (message.author.id === context.client.userId || (message.webhookId && message.webhookId === context.applicationId)) {
    // slash command/context menu/component responses and their followups all point to the interaction
    const metadata = message.interactionMetadata;
    if (metadata) {
      // a modal's response belongs to the interaction that opened the modal
      const root = metadata.triggeringInteractionMetadata || metadata;
      // a button/select's response belongs to the command use of the message it was on (when we still have it cached)
      if (root.interactedMessageId && BigInt(root.interactedMessageId) < BigInt(message.id)) {
        const interacted = context.messages.get(root.interactedMessageId);
        if (interacted) {
          return getExecutionId(context, interacted);
        }
      }
      return root.id;
    }
    if (message.interaction) {
      return message.interaction.id;
    }
    // prefixed command responses reply to the command message
    const { messageReference } = message;
    if (messageReference && messageReference.messageId && messageReference.channelId === message.channelId) {
      if (BigInt(messageReference.messageId) < BigInt(message.id)) {
        return messageReference.messageId;
      }
    }
  }
  return message.id;
}
