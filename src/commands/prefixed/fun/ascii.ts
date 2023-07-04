import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ascii';

export default class AsciiCommand extends BaseCommand {
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
        id: Formatter.Commands.FunAscii.COMMAND_ID,
        usage: '<text>',
      },
      priority: -1,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunAscii.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.FunAscii.CommandArgs) {
    return Formatter.Commands.FunAscii.createMessage(context, args);
  }
}
