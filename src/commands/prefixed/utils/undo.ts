import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


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
        id: Formatter.Commands.UtilsUndo.COMMAND_ID,
        usage: '?<amount>',
      },
      type: Parameters.number({max: Formatter.Commands.UtilsUndo.MAX_AMOUNT, min: 1}),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.UtilsUndo.CommandArgs) {
    return Formatter.Commands.UtilsUndo.createMessage(context, args);
  }
}
