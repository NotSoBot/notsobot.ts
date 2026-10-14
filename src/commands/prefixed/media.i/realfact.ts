import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'realfact';

export default class RealfactCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['fact', 'snapple'],
      label: 'text',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put text on a Snapple "Real Fact" cap',
        examples: [
          `${COMMAND_NAME} cats cannot taste sweetness`,
        ],
        id: Formatter.Commands.MediaICreateRealfact.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateRealfact.CommandArgs) {
    return !!args.text;
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaICreateRealfact.CommandArgs) {
    return Formatter.Commands.MediaICreateRealfact.createMessage(context, args);
  }
}
