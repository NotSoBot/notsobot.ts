import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'credits give';

export default class CreditsGiveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'amount',
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Give this server some of your bought NotSoCredits so everyone here can use NotSoAI',
        examples: [
          `${COMMAND_NAME} 5000`,
        ],
        id: Formatter.Commands.CreditsGive.COMMAND_ID,
        usage: '<amount:number>',
      },
      required: true,
      type: Number,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.CreditsGive.CommandArgs) {
    return Formatter.Commands.CreditsGive.createMessage(context, args);
  }
}
