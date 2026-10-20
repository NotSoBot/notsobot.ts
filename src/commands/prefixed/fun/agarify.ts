import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'agarify';

export default class AgarifyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['agario'],
      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Turn text into an agar.io style name with a clan tag (Default: your name)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.FunAgarify.COMMAND_ID,
        usage: '?<text>',
      },
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  run(context: Command.Context, args: Formatter.Commands.FunAgarify.CommandArgs) {
    return Formatter.Commands.FunAgarify.createMessage(context, args);
  }
}
