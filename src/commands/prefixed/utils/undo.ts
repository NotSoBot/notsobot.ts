import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  amount: number,
}

export const COMMAND_NAME = 'undo';

export default class UndoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: 1,
      label: 'amount',
      metadata: {
        description: 'Undo your last commands. (Up to 5 last commands, default 1)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 5`,
        ],
        category: CommandCategories.UTILS,
        usage: `${COMMAND_NAME}`,
      },
      type: Parameters.number({max: 5, min: 1}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const messageIdPairs: Array<{fromInteraction: boolean, ids: Array<bigint>}> = [];

    {
      // get as many normal commands as possible
      let found = 0;
      for (let {context: lastContext, reply: lastReply} of context.commandClient.replies.toArray().reverse()) {
        if (args.amount <= found) {
          break;
        }
        if (lastContext.channelId !== context.channelId || lastContext.userId !== context.userId) {
          continue;
        }
        const store: {fromInteraction: boolean, ids: Array<bigint>}= {fromInteraction: false, ids: []};
        if (lastContext.message.canDelete && !lastContext.message.deleted) {
          store.ids.push(BigInt(lastContext.message.id));
        }
        if (lastReply.canDelete && !lastReply.deleted) {
          store.ids.push(BigInt(lastReply.id));
          messageIdPairs.push(store);
          found++;
        }
      }
    }

    {
      // get as many interaction commands as possible
      let found = 0;
      for (let message of context.messages.filter((x) => x.channelId === context.channelId).reverse()) {
        if (args.amount <= found) {
          break;
        }
        // same channel, has interaction, is from me, interaction is from the user
        if (!message.interaction || !message.fromMe || message.interaction.user.id !== context.userId) {
          continue;
        }
        messageIdPairs.push({fromInteraction: true, ids: [BigInt(message.id)]})
        found++;
      }
    }

    if (context.message.canDelete && !context.message.deleted) {
      await context.message.delete();
    }

    const count = {interactions: 0, prefixed: 0};
    const messageIds = messageIdPairs.sort((x, y) => {
      if (x.ids.length && y.ids.length) {
        return parseInt((y.ids[0] - x.ids[0]) as any);
      }
      return 0;
    }).slice(0, args.amount).map((x) => {
      if (x.fromInteraction) {
        count.interactions++;
      } else {
        count.prefixed++;
      }
      return x.ids;
    }).flat().map((x) => String(x));

    let message: Structures.Message;
    if (messageIds.length) {
      if (context.inDm) {
        // go through each message id and delete it
        // their messages shouldn't be in the messageId array
        for (let messageId of messageIds) {
          await context.rest.deleteMessage(context.channelId, messageId);
        }
      } else {
        if (messageIds.length === 1 || !context.canManage) {
          for (let messageId of messageIds) {
            await context.rest.deleteMessage(context.channelId, messageId);
          }
        } else {
          await context.rest.bulkDeleteMessages(context.channelId, messageIds);
        }
      }

      let text: string;
      if (count.interactions && count.prefixed) {
        text = `Successfully deleted ${count.interactions} interactions and ${count.prefixed} commands.`;
      } else if (count.interactions) {
        text = `Successfully deleted ${count.interactions} interactions.`;
      } else {
        text = `Successfully deleted ${count.prefixed} commands.`;
      }
      message = await editOrReply(context, text);
    } else {
      message = await editOrReply(context, `Could not find any of your last commands.`);
    }
    setTimeout(async () => {
      if (!message.deleted) {
        await message.delete();
      }
    }, 1000);
  }
}
