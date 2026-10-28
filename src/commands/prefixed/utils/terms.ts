import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'terms';

export default class TermsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tos'],
      metadata: {
        description: 'Show NotSoBot\'s Terms of Service',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILITY,
        id: Formatter.Commands.UtilsTerms.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.UtilsTerms.createMessage(context);
  }
}
