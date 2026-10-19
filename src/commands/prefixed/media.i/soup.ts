import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'soup';

export default class SoupCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text with alphabet soup letters',
        examples: [
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaICreateSoup.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateSoup.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateSoup.CommandArgs) {
    return Formatter.Commands.MediaICreateSoup.createMessage(context, args);
  }
}
