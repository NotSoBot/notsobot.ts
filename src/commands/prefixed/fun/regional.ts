import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'regional';

export default class RegionalCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Convert text to regional emojis',
        examples: [
          `${COMMAND_NAME} lol`,
        ],
        id: Formatter.Commands.FunRegional.COMMAND_ID,
        category: CommandCategories.FUN,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunRegional.CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: Formatter.Commands.FunRegional.CommandArgs) {
    return Formatter.Commands.FunRegional.createMessage(context, args);
  }
}
