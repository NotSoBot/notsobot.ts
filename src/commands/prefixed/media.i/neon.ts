import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'neon';

export default class NeonCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Write text as a neon sign',
        examples: [
          `${COMMAND_NAME} line 1 | line 2`,
        ],
        id: Formatter.Commands.MediaICreateNeon.COMMAND_ID,
        usage: '<text> (| <text 2>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateNeon.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateNeon.CommandArgs) {
    return Formatter.Commands.MediaICreateNeon.createMessage(context, args);
  }
}
