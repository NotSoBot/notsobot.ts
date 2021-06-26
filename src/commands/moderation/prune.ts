import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup, Snowflake } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../constants';
import { DefaultParameters, Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export const MAX_FETCHES = 10;
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
  in: Structures.Channel,
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
        {name: 'in', default: DefaultParameters.channel, type: Parameters.channel({types: [ChannelTypes.GUILD_TEXT, ChannelTypes.GUILD_NEWS]})},
        {name: 'with', type: Parameters.string({minLength: 1})},
      ],
      default: null,
      disableDm: true,
      label: 'amount',
      metadata: {
        description: 'Prune multiple messages, default 10 messages',
        examples: [
          `${COMMAND_NAME} 100`,
          `${COMMAND_NAME} 100 -from cake`,
          `${COMMAND_NAME} 500 -with discord.gg`,
          `${COMMAND_NAME} 500 -with discord.gg -in general`
        ],
        type: CommandTypes.MODERATION,
        usage: '<max_messages> (-after <message_id>) (-before <message_id>) (-from <user>) (-in <channel>) (-with <text>)',
      },
      permissionsClient: [Permissions.MANAGE_MESSAGES],
      permissions: [Permissions.MANAGE_MESSAGES],
      type: Parameters.number({max: 500, min: 1}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return args.amount !== null && !isNaN(args.amount) && !args.after;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (isNaN(args.amount)) {
      return editOrReply(context, '⚠ Amount has to be a number lmao');
    }
    if (args.after) {
      return editOrReply(context, '⚠ After isn\'t supported yet, im so sorry ;(');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const bulk: Array<string> = [];
    const manual: Array<string> = [];

    let before = args.before || context.messageId;
    for (let message of args.in.messages.toArray().reverse()) {
      if (message.id === context.messageId) {
        continue;
      }
      if (args.amount <= bulk.length + manual.length) {
        break;
      }
      if (this.shouldDelete(message, args)) {
        if (this.shouldBulkDelete(message.createdAtUnix)) {
          bulk.push(message.id);
        } else {
          manual.push(message.id);
        }
      }
      before = message.id;
    }

    let tries = 0;
    while (tries++ < MAX_FETCHES && bulk.length + manual.length < args.amount) {
      const messages = await args.in.fetchMessages({before, limit: 100});
      for (let message of messages.toArray()) {
        if (args.amount <= bulk.length + manual.length) {
          break;
        }
        if (this.shouldDelete(message, args)) {
          if (this.shouldBulkDelete(message.createdAtUnix)) {
            bulk.push(message.id);
          } else {
            manual.push(message.id);
          }
        }
        before = message.id;
      }
      if (!this.shouldBulkDelete(Snowflake.timestamp(before))) {
        // check before date to see if it was made before 2 weeks (temporarily)
        break;
      }
    }

    let message: Structures.Message;
    if (bulk.length + manual.length) {
      message = await editOrReply(context, `Deleting ${(bulk.length + manual.length).toLocaleString()} messages`);
    } else {
      message = await editOrReply(context, `Unable to prune any messages`);
    }

    if (bulk.length) {
      for (let i = 0; i < bulk.length; i += 100) {
        const messageIds = bulk.slice(i, i + 100);
        await args.in.bulkDelete(messageIds);
      }
    }

    if (manual.length) {
      const reason = `Pruning of ${(bulk.length + manual.length).toLocaleString()} messages by ${context.user} (${context.user.id})`;
      for (let messageId of manual) {
        await args.in.deleteMessage(messageId, {reason});
      }
    }

    if (bulk.length + manual.length) {
      await message.edit(`Deleted ${(bulk.length + manual.length).toLocaleString()} messages`);
    }

    setTimeout(async () => {
      if (context.message.canDelete && !context.message.deleted) {
        await context.message.delete();
      }
      if (!message.deleted) {
        await message.delete();
      }
    }, 2000);
  }

  shouldBulkDelete(timestamp: number): boolean {
    return Date.now() - timestamp < TWO_WEEKS_IN_MILLISECONDS_WITH_LEEWAY;
  }

  shouldDelete(message: Structures.Message, args: CommandArgs): boolean {
    if (!message.canDelete) {
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
}
