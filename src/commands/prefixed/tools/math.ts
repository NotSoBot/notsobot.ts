import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'math';

export default class MathCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['calculate', 'calc'],
      label: 'equation',
      metadata: {
        category: CommandCategories.UTILITY,
        pipeable: true,
        description: 'Solve a math expression',
        examples: [
          `${COMMAND_NAME} 5 + 5`,
          `${COMMAND_NAME} 5 miles to km`,
          `${COMMAND_NAME} base(1295, 36)`,
          `${COMMAND_NAME} frombase("zz", 36)`,
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
