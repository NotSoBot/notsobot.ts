import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'lucia';

export default class LuciaCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['playwithlucia'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make a "Play with Lucia" prompt asking for your text',
        examples: [
          `${COMMAND_NAME} hop on deadlock`,
          `${COMMAND_NAME} help me move a couch`,
        ],
        id: Formatter.Commands.MediaICreateLucia.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateLucia.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateLucia.CommandArgs) {
    return Formatter.Commands.MediaICreateLucia.createMessage(context, args);
  }
}
