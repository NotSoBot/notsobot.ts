import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'sonic';

export default class SonicCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['sonicsays'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make Sonic say some text',
        examples: [
          `${COMMAND_NAME} drink water`,
        ],
        id: Formatter.Commands.MediaICreateSonic.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateSonic.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateSonic.CommandArgs) {
    return Formatter.Commands.MediaICreateSonic.createMessage(context, args);
  }
}
