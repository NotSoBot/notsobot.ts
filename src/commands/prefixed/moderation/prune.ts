import { Collections, Command, CommandClient, Structures } from 'detritus-client';
import {
  ChannelTypes,
  InteractionCallbackTypes,
  MessageComponentButtonStyles,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';
import { ComponentActionRow, ComponentContext, Markup, Snowflake } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { CommandCategories, DateMomentLogFormat, EmbedColors } from '../../../constants';
import ServerExecutionsStore from '../../../stores/serverexecutions';
import { DefaultParameters, Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../../utils';

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
  with?: string,
}

export interface CommandArgs {
  after?: string,
  amount: number,
  before?: string,
  from?: Array<Structures.Member | Structures.User>,
  in?: Structures.Channel,
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
        usage: '<max_messages> (-after <message_id>) (-before <message_id>) (-from <user>) (-in <channel>) (-with <text>)',
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
    return args.amount !== null && !isNaN(args.amount);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.after && args.before && BigInt(args.before) <= BigInt(args.after)) {
      return editOrReply(context, '⚠ After message id cannot be after or the same as the Before message id');
    }
    if (isNaN(args.amount)) {
      return editOrReply(context, '⚠ Amount has to be a number lmao');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const bulk = new Collections.BaseCollection<string, Structures.Message>();
    const manual = new Collections.BaseCollection<string, Structures.Message>();

    const channelId = (args.in) ? args.in.id : context.channelId;

    const isExecuting = ServerExecutionsStore.getOrCreate(context.guildId || context.channelId);
    if (isExecuting.prune) {
      return editOrReply(context, 'Currently pruning this server, wait for it to finish');
    }

    isExecuting.prune = true;
    try {
      let after: string | undefined;
      if (args.after) {
        after = args.after;
      }
  
      let before: string;
      if (args.before) {
        before = args.before;
      } else {
        const { messageReference } = context.message;
        if (messageReference && messageReference.messageId && messageReference.channelId === channelId) {
          args.before = before = String(BigInt(messageReference.messageId) + 1n);
        } else {
          before = context.messageId;
        }
      }

      if (args.in) {
        let messages = args.in.messages.toArray();
        if (!after) {
          messages = messages.reverse();
        }
  
        for (let message of messages) {
          if (message.id === context.messageId) {
            continue;
          }
          if (args.amount <= bulk.length + manual.length) {
            break;
          }
          if (this.shouldDelete(message, args)) {
            if (!context.inDm && this.shouldBulkDelete(message.createdAtUnix)) {
              bulk.set(message.id, message);
            } else {
              manual.set(message.id, message);
            }
          }
          before = message.id;
        }
      }

      let tries = 0;
      while (tries++ < MAX_FETCHES && bulk.length + manual.length < args.amount) {
        let messages: Array<Structures.Message>;
        if (after) {
          const cache = await context.rest.fetchMessages(channelId, {after, limit: 100});
          messages = cache.toArray().reverse();
          if (cache.length) {
            after = cache.first()!.id;
            before = messages[0]!.id;
          }
        } else {
          const cache = await context.rest.fetchMessages(channelId, {before, limit: 100});
          messages = cache.toArray();
        }
        if (!messages.length) {
          break;
        }
        for (let message of messages) {
          if (args.amount <= bulk.length + manual.length) {
            break;
          }
          if (this.shouldDelete(message, args)) {
            if (!context.inDm && this.shouldBulkDelete(message.createdAtUnix)) {
              bulk.set(message.id, message);
            } else {
              manual.set(message.id, message);
            }
          }
          if (!after) {
            before = message.id;
          }
        }
        if (!this.shouldBulkDelete(Snowflake.timestamp(before))) {
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
    const timeout = new Timers.Timeout();
    if (total) {
      if (total <= MAX_MESSAGES_BEFORE_CONFIRMATION && total === args.amount) {
        try {
          const message = await editOrReply(context, `Ok, pruning ${total.toLocaleString()} messages.`);
          const deletedTotal = await this.deleteMessages(context, channelId, bulk, manual);
          if (message.canEdit) {
            await message.edit(`Successfully deleted ${deletedTotal.toLocaleString()} messages`);
          }
          await this.clearMessages(timeout, [context.message, message]);
        } catch(error) {
          
        } finally {
          isExecuting.prune = false;
        }
      } else {
        const actionRow = new ComponentActionRow();
        actionRow.createButton({
          label: 'Continue',
          run: async (ctx: ComponentContext) => {
            if (!timeout.hasStarted || ctx.userId !== context.userId) {
              return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
            }
            timeout.stop();

            await ctx.editOrRespond({
              content: `Ok, pruning ${total.toLocaleString()} messages.`,
              components: [],
            });

            try {
              const deletedTotal = await this.deleteMessages(context, channelId, bulk, manual);
              if (deletedTotal === total) {
                await ctx.editOrRespond(`Successfully deleted ${deletedTotal.toLocaleString()} messages`);
              } else {
                await ctx.editOrRespond(`Successfully deleted ${deletedTotal.toLocaleString()} out of ${total.toLocaleString()} messages`);
              }
            } catch(error) {
              await ctx.editOrRespond(`Pruning messages errored out: ${error}`);
            } finally {
              isExecuting.prune = false;
            }

            await this.clearMessages(timeout, [context.message, message]);
          },
        });

        actionRow.createButton({
          label: 'Cancel',
          style: MessageComponentButtonStyles.DANGER,
          run: async (ctx: ComponentContext) => {
            if (!timeout.hasStarted || ctx.userId !== context.userId) {
              return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
            }
            timeout.stop();

            isExecuting.prune = false;
            await ctx.editOrRespond({
              content: `Ok, canceled pruning of ${total.toLocaleString()} messages.`,
              components: [],
            });
            await this.clearMessages(timeout, [context.message], 0);
            await this.clearMessages(timeout, [message]);
          },
        });

        let content: string;
        if (args.amount === total) {
          content = `Found ${total.toLocaleString()} messages to delete.`;
        } else {
          content = `Found ${total.toLocaleString()} messages to delete. (Out of the ${args.amount.toLocaleString()} messages requested)`;
        }

        isExecuting.prune = false;
        const message = await editOrReply(context, {content, components: [actionRow]});
        this.clearMessages(timeout, [context.message, message], MAX_TIME_TO_RESPOND);
      }
    } else {
      isExecuting.prune = false;
      const message = await editOrReply(context, {
        content: 'Unable to prune any messages',
        flags: MessageFlags.EPHEMERAL,
      });
      this.clearMessages(timeout, [context.message, message]);
    }
  }

  async deleteMessages(
    context: Command.Context,
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

      const reason = `Pruning of ${deletedTotal.toLocaleString()} messages by ${context.user} (${context.user.id})`;
      for (let messageId of manualToDelete) {
        await context.rest.deleteMessage(channelId, messageId, {reason});
      }
    }

    return deletedTotal;
  }

  async clearMessages(timeout: Timers.Timeout, messages: Array<Structures.Message>, timeToWait = MAX_MESSAGE_LIFE): Promise<void> {
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

  shouldBulkDelete(timestamp: number): boolean {
    return Date.now() - timestamp < TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY;
  }

  shouldDelete(message: Structures.Message, args: CommandArgs): boolean {
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

    if (args.from && !args.from.some((user) => message.author.id === user.id)) {
      return false;
    }

    if (args.with && !message.content.toLowerCase().includes(args.with.toLowerCase())) {
      return false;
    }

    return true;
  }
}
