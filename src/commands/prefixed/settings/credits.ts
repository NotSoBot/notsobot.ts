import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'credits';

export default class CreditsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'See how many NotSoCredits you and this server have left',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.Credits.COMMAND_ID,
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.Credits.CommandArgs) {
    return Formatter.Commands.Credits.createMessage(context, args);
  }
}
