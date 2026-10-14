import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'hacker';

export default class HackerCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'template', aliases: ['t'], type: (value: string) => Math.max(0, Math.min(1, (parseInt(value) || 1) - 1))},
      ],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put text on a hacker\'s screen',
        examples: [
          `${COMMAND_NAME} sudo hack the mainframe`,
          `${COMMAND_NAME} downloading more ram -template 2`,
        ],
        id: Formatter.Commands.MediaICreateHacker.COMMAND_ID,
        usage: '<text> (-template <1|2>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateHacker.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateHacker.CommandArgs) {
    return Formatter.Commands.MediaICreateHacker.createMessage(context, args);
  }
}
