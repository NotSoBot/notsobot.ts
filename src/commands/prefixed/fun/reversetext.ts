import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


const COMMAND_NAME = 'reversetext';

export default class ReverseTextCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Reverse text',
        examples: [
          `${COMMAND_NAME} NotSoBot`,
        ],
        id: Formatter.Commands.FunReverseText.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunReverseText.CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: Formatter.Commands.FunReverseText.CommandArgs) {
    return Formatter.Commands.FunReverseText.createMessage(context, args);
  }
}
