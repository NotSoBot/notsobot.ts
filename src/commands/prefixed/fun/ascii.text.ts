import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ascii text';

export default class AsciiTextCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Convert text to an ASCII Image',
        examples: [
          `${COMMAND_NAME} NotSoBot`,
        ],
        id: Formatter.Commands.FunAsciiFromText.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunAsciiFromText.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.FunAsciiFromText.CommandArgs) {
    return Formatter.Commands.FunAsciiFromText.createMessage(context, args);
  }
}
