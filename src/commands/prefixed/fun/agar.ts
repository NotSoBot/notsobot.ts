import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'agar';

export default class AgarCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Turn text into an agar.io style name (Default: your name)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.FunAgar.COMMAND_ID,
        usage: '?<text>',
      },
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  run(context: Command.Context, args: Formatter.Commands.FunAgar.CommandArgs) {
    return Formatter.Commands.FunAgar.createMessage(context, args);
  }
}
