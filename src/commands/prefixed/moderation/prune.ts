import { Collections, Command, CommandClient, Interaction, Structures } from 'detritus-client';
import {
  ChannelTypes,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  Permissions,
} from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { CommandCategories, DateMomentLogFormat, EmbedColors, StatusEmojis } from '../../../constants';
import ServerExecutionsStore from '../../../stores/serverexecutions';
import { DefaultParameters, I18n, Parameters, createTimestampMomentFromGuild, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const MAX_FETCHES = 10;
export const MAX_MESSAGE_LIFE = 4 * 1000;
export const MAX_MESSAGES_BEFORE_CONFIRMATION = 15;
export const MAX_TIME_TO_RESPOND = 60 * 1000;
export const TWO_WEEKS_IN_MILLISECONDS = 2 * 7 * 24 * 60 * 60 * 1000;
export const TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY = TWO_WEEKS_IN_MILLISECONDS - 200;


export interface CommandArgsBefore {
  after?: string,
  amount: number,
  before?: string,
  from?: Array<Structures.Member | Structures.User>,
  in?: Structures.Channel,
  until?: string,
  with?: string,
}

export interface CommandArgs {
  after?: string,
  amount: number,
  before?: string,
  from?: Array<Structures.Member | Structures.User>,
  in?: Structures.Channel,
  until?: string,
  with?: string,
}

export const COMMAND_NAME = 'prune';

export default class PruneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'purge',
      ],
      args: [
        {name: 'after', type: Parameters.snowflake},
        {name: 'before', type: Parameters.snowflake},
        {name: 'from', type: Parameters.membersOrUsers()},
        {name: 'in', default: DefaultParameters.channel, type: Parameters.channel({
          types: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_NEWS],
        })},
        {name: 'until', type: Parameters.snowflake},
        {name: 'with', type: Parameters.string({minLength: 1})},
      ],
      default: null,
      label: 'amount',
      metadata: {
        description: 'Prune multiple messages, default 10 messages',
        examples: [
          `${COMMAND_NAME} 100`,
          `${COMMAND_NAME} 100 -from cake`,
          `${COMMAND_NAME} 500 -with discord.gg`,
          `${COMMAND_NAME} 500 -with discord.gg -in general`
        ],
        category: CommandCategories.MODERATION,
        usage: '<max_messages> (-after <message_id>) (-before <message_id>) (-from <user>) (-in <channel>) (-until <message_id>) (-with <text>)',
      },
      permissionsClient: [Permissions.MANAGE_MESSAGES],
      permissions: [Permissions.MANAGE_MESSAGES],
      type: Parameters.number({max: 500, min: 1}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    // if afterId is after beforeId, error out
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      return false;
    }
    // until must be before the current message
    if (args.until && BigInt(context.message.id) <= BigInt(args.until)) {
      return false;
    }
    if (args.amount === null) {
      if (args.until) {
        args.amount = 100;
      } else {
        return false;
      }
    }
    if (isNaN(args.amount)) {
      return false;
    }
    return true;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('prune.after_before')}`});
    }
    if (args.until && BigInt(context.message.id) <= BigInt(args.until)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('prune.until_after_current')}`});
    }
    if (isNaN(args.amount)) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('prune.amount_number')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    return createPruneMessage(context, args);
  }
}


export async function createPruneMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await I18n.getTranslator(context);
  const bulk = new Collections.BaseCollection<string, Structures.Message>();
  const manual = new Collections.BaseCollection<string, Structures.Message>();

  const channelId = (args.in) ? args.in.id : context.channelId!;

  const isExecuting = ServerExecutionsStore.getOrCreate((context.guildId || context.channelId)!);
  if (isExecuting.prune) {
    return displayReply(context, {description: translate('prune.in_progress')});
  }

  // set when we walk back far enough to hit the `until` message, meaning everything in the range was found
  let reachedUntil = false;
  // set when walking forwards with `after` reaches the upper bound
  let reachedEnd = false;

  isExecuting.prune = true;
  try {
    let after: string | undefined;
    if (args.after) {
      after = args.after;
    }

    let before: string;
    if (args.before) {
      before = args.before;
    } else if (context instanceof Command.Context) {
      const { messageReference } = context.message;
      if (messageReference && messageReference.messageId && messageReference.channelId === channelId) {
        // we do not want to delete the referenced message, right?
        args.before = before = messageReference.messageId; //String(BigInt(messageReference.messageId) + 1n);
      } else {
        before = context.messageId;
      }
    } else {
      before = snowflakeFromNow();
    }
    // always filter by the upper bound so `-after` (which walks forwards) never picks up the command message or anything newer
    if (!args.before) {
      args.before = before;
    }
    const upperBound = BigInt(before);

    if (after) {
      // messages older than 2 weeks can't be bulk deleted, so skip ahead to the 2 week mark instead of stopping on the first page
      const twoWeeksAgo = snowflakeFromTimestamp(Date.now() - TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY);
      if (BigInt(after) < BigInt(twoWeeksAgo)) {
        after = twoWeeksAgo;
      }
    }

    let until: bigint | undefined;
    if (args.until) {
      until = BigInt(args.until);
      // nothing to walk if the range is empty
      if (BigInt(before) <= until) {
        reachedUntil = true;
      }
      // when walking forwards, start at the until message instead of fetching older pages we'd skip anyway
      if (after && BigInt(after) < until - 1n) {
        after = String(until - 1n);
      }
    }

    if (args.in) {
      let messages = args.in.messages.toArray();
      if (!after) {
        messages = messages.reverse();
      }

      for (let message of messages) {
        if (context instanceof Command.Context && message.id === context.messageId) {
          continue;
        }
        // when walking backwards, everything past `until` is older, so stop
        if (!after && until !== undefined && BigInt(message.id) < until) {
          reachedUntil = true;
          break;
        }
        if (args.amount <= bulk.length + manual.length) {
          break;
        }
        if (shouldDelete(message, args)) {
          if (!context.inDm && shouldBulkDelete(message.createdAtUnix)) {
            bulk.set(message.id, message);
          } else {
            manual.set(message.id, message);
          }
        }
        before = message.id;
      }
    }

    let tries = 0;
    while (!reachedUntil && !reachedEnd && tries++ < MAX_FETCHES && bulk.length + manual.length < args.amount) {
      let messages: Array<Structures.Message>;
      if (after) {
        const cache = await context.rest.fetchMessages(channelId, {after, limit: 100});
        messages = cache.toArray().reverse();
        if (cache.length) {
          after = cache.first()!.id;
          before = messages[0]!.id;
        }
        // walked past the upper bound (or hit the newest message), nothing newer to look at
        if (messages.length < 100 || upperBound <= BigInt(after)) {
          reachedEnd = true;
        }
      } else {
        const cache = await context.rest.fetchMessages(channelId, {before, limit: 100});
        messages = cache.toArray();
        // hit the start of the channel, so everything after `until` has been seen
        if (until !== undefined && messages.length < 100) {
          reachedUntil = true;
        }
      }
      if (!messages.length) {
        break;
      }
      for (let message of messages) {
        // when walking backwards, everything past `until` is older, so stop fetching entirely
        if (!after && until !== undefined && BigInt(message.id) < until) {
          reachedUntil = true;
          break;
        }
        if (args.amount <= bulk.length + manual.length) {
          break;
        }
        if (shouldDelete(message, args)) {
          if (!context.inDm && shouldBulkDelete(message.createdAtUnix)) {
            bulk.set(message.id, message);
          } else {
            manual.set(message.id, message);
          }
        }
        if (!after) {
          before = message.id;
        }
      }
      if (!shouldBulkDelete(Snowflake.timestamp(before))) {
        // check before date to see if it was made before 2 weeks (temporarily)
        break;
      }
    }
  } catch(error) {
    isExecuting.prune = false;
    throw error;
  }

  if (bulk.length === 2) {
    for (let [messageId, message] of bulk) {
      manual.set(message.id, message);
    }
    bulk.clear();
  }

  const total = bulk.length + manual.length;
  // finding fewer than `amount` is expected once we've walked the whole range (hit `until`, or the upper bound with `after`)
  const isComplete = total === args.amount || reachedUntil || reachedEnd;
  const timeout = new Timers.Timeout();
  if (total) {
    if (total <= MAX_MESSAGES_BEFORE_CONFIRMATION && isComplete) {
      try {
        const message = await displayReply(context, {description: translate('prune.starting', {count: total.toLocaleString(language)})});
        const deletedTotal = await deleteMessages(context, channelId, bulk, manual);
        // edits the starting response
        await displayReply(context, {description: translate('prune.deleted', {count: deletedTotal.toLocaleString(language)})});
        await clearMessages(timeout, messagesToClear(context, message));
      } catch(error) {
        await displayReply(context, {description: translate('prune.errored', {error: String(error)})});
      } finally {
        isExecuting.prune = false;
      }
    } else {
      const components = new Components({timeout: MAX_TIME_TO_RESPOND});
      components.createButton({
        label: translate('common.continue'),
        run: async (ctx: ComponentContext) => {
          if (!timeout.hasStarted || ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }
          timeout.stop();

          await displayReply(context, {description: translate('prune.starting', {count: total.toLocaleString(language)})}, {replyTo: ctx});

          try {
            const deletedTotal = await deleteMessages(context, channelId, bulk, manual);
            if (deletedTotal === total) {
              await displayReply(context, {description: translate('prune.deleted', {count: deletedTotal.toLocaleString(language)})}, {replyTo: ctx});
            } else {
              await displayReply(context, {description: translate('prune.deleted_partial', {count: deletedTotal.toLocaleString(language), total: total.toLocaleString(language)})}, {replyTo: ctx});
            }
          } catch(error) {
            await displayReply(context, {description: translate('prune.errored', {error: String(error)})}, {replyTo: ctx});
          } finally {
            isExecuting.prune = false;
          }

          await clearMessages(timeout, messagesToClear(context, message));
        },
      });

      components.createButton({
        label: translate('common.cancel'),
        style: MessageComponentButtonStyles.DANGER,
        run: async (ctx: ComponentContext) => {
          if (!timeout.hasStarted || ctx.userId !== context.userId) {
            return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
          }
          timeout.stop();

          isExecuting.prune = false;
          await displayReply(context, {description: translate('prune.canceled', {count: total.toLocaleString(language)})}, {replyTo: ctx});
          await clearMessages(timeout, messagesToClear(context), 0);
          await clearMessages(timeout, (message) ? [message] : []);
        },
      });

      let content: string;
      if (isComplete) {
        content = translate('prune.found', {count: total.toLocaleString(language)});
      } else {
        content = translate('prune.found_partial', {count: total.toLocaleString(language), requested: args.amount.toLocaleString(language)});
      }

      isExecuting.prune = false;
      const message = await displayReply(context, {components, description: content});
      clearMessages(timeout, messagesToClear(context, message), MAX_TIME_TO_RESPOND);
    }
  } else {
    isExecuting.prune = false;
    const message = await displayReply(context, {description: translate('prune.none'), ephemeral: true});
    clearMessages(timeout, messagesToClear(context, message));
  }
}


export async function deleteMessages(
  context: Command.Context | Interaction.InteractionContext,
  channelId: string,
  bulk: Collections.BaseCollection<string, Structures.Message>,
  manual: Collections.BaseCollection<string, Structures.Message>,
): Promise<number> {
  let deletedTotal = 0;
  if (bulk.length) {
    const bulkToDelete = bulk.filter((message) => message.canDelete && !message.deleted).map((message) => message.id);
    deletedTotal += bulkToDelete.length;

    for (let i = 0; i < bulkToDelete.length; i += 100) {
      const messageIds = bulkToDelete.slice(i, i + 100);
      if (messageIds.length === 1) {
        await context.rest.deleteMessage(channelId, messageIds[0]);
      } else {
        await context.rest.bulkDeleteMessages(channelId, messageIds);
      }
    }
  }

  if (manual.length) {
    const manualToDelete = manual.filter((message) => message.canDelete && !message.deleted).map((message) => message.id);
    deletedTotal += manualToDelete.length;

    const { translate } = I18n.getCachedTranslator(context);
    const reason = translate('prune.audit_reason', {count: deletedTotal.toLocaleString(), user: `${context.user} (${context.user.id})`});
    for (let messageId of manualToDelete) {
      await context.rest.deleteMessage(channelId, messageId, {reason});
    }
  }

  return deletedTotal;
}

export async function clearMessages(timeout: Timers.Timeout, messages: Array<Structures.Message>, timeToWait = MAX_MESSAGE_LIFE): Promise<void> {
  return new Promise((resolve) => {
    timeout.start(timeToWait, async () => {
      try {
        for (let message of messages) {
          if (message.canDelete && !message.deleted) {
            await message.delete();
          }
        }
      } catch(error) {
        // /shrug
      }
      resolve();
    });
  });
}

export function shouldBulkDelete(timestamp: number): boolean {
  return Date.now() - timestamp < TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY;
}

export function shouldDelete(message: Structures.Message, args: CommandArgs): boolean {
  if (!message.canDelete) {
    return false;
  }

  if (args.after || args.before) {
    const messageId = BigInt(message.id);

    if (args.after && messageId <= BigInt(args.after)) {
      return false;
    }

    if (args.before && BigInt(args.before) <= messageId) {
      return false;
    }
  }

  if (args.until && BigInt(message.id) < BigInt(args.until)) {
    return false;
  }

  if (args.from && !args.from.some((user) => message.author.id === user.id)) {
    return false;
  }

  if (args.with && !message.content.toLowerCase().includes(args.with.toLowerCase())) {
    return false;
  }

  return true;
}


export function messagesToClear(
  context: Command.Context | Interaction.InteractionContext,
  ...messages: Array<Structures.Message | null | void>
): Array<Structures.Message> {
  // only clear up messages from prefixed commands, interaction responses are left alone
  if (!(context instanceof Command.Context)) {
    return [];
  }
  return [context.message, ...messages].filter((message) => !!message) as Array<Structures.Message>;
}

export const DISCORD_EPOCH = 1420070400000;

export function snowflakeFromNow(): string {
  return snowflakeFromTimestamp(Date.now());
}

export function snowflakeFromTimestamp(timestamp: number): string {
  return (BigInt(timestamp - DISCORD_EPOCH) << BigInt(22)).toString();
}
