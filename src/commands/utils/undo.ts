import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes } from '../../constants';
import { Parameters } from '../../utils';

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
        type: CommandTypes.UTILS,
        usage: `${COMMAND_NAME}`,
      },
      permissionsClient: [Permissions.MANAGE_MESSAGES],
      type: Parameters.number({max: 5, min: 1}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    let found = 0;
    const messageIds: Array<string> = [];
    for (let {context: lastContext, reply: lastReply} of context.commandClient.replies.toArray().reverse()) {
      if (args.amount <= found) {
        break;
      }
      if (lastContext.channelId === context.channelId) {
        if (lastContext.userId === context.userId) {
          if (lastContext.message.canDelete && !lastContext.message.deleted) {
            messageIds.push(lastContext.message.id);
          }
          if (lastReply.canDelete && !lastReply.deleted) {
            messageIds.push(lastReply.id);
            found++;
          }
        }
      }
    }

    if (context.message.canDelete && !context.message.deleted) {
      await context.message.delete();
    }

    let message: Structures.Message;
    if (messageIds.length) {
      if (context.inDm) {
        // go through each message id and delete it
        // their messages shouldn't be in the messageId array
        for (let messageId of messageIds) {
          await context.rest.deleteMessage(context.channelId, messageId);
        }
      } else {
        if (messageIds.length === 1) {
          await context.rest.deleteMessage(context.channelId, messageIds[0]);
        } else {
          await context.rest.bulkDeleteMessages(context.channelId, messageIds);
        }
      }
      message = await context.editOrReply(`Successfully deleted ${found} commands.`);
    } else {
      message = await context.editOrReply(`Could not find any of your last commands.`);
    }
    setTimeout(async () => {
      if (!message.deleted) {
        await message.delete();
      }
    }, 1000);
  }
}
