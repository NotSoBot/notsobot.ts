import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'clean';

export default class CleanCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'amount',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Delete my recent command uses: the messages that used my commands and my responses to them (including slash commands)',
        examples: [
          `${COMMAND_NAME} 10`,
        ],
        id: Formatter.Commands.ModerationClean.COMMAND_ID,
        usage: '<amount>',
      },
      // without Manage Messages on the bot's side, only our own messages get deleted (one by one)
      permissions: [Permissions.MANAGE_MESSAGES],
      type: Parameters.number({max: Formatter.Commands.ModerationClean.MAX_AMOUNT, min: 1}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationClean.CommandArgs) {
    return !!args.amount;
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationClean.CommandArgs) {
    return Formatter.Commands.ModerationClean.createMessage(context, args);
  }
}
