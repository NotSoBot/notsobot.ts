import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'math';

export default class MathCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['m', 'calculate', 'c'],
      label: 'equation',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Evaluate a Math Equation',
        examples: [
          `${COMMAND_NAME} 5 + 5`,
          `${COMMAND_NAME} 5 miles to km`,
        ],
        id: Formatter.Commands.ToolsMath.COMMAND_ID,
        usage: '<equation>',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ToolsMath.CommandArgs) {
    return !!args.equation;
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMath.CommandArgs) {
    return Formatter.Commands.ToolsMath.createMessage(context, args);
  }
}
