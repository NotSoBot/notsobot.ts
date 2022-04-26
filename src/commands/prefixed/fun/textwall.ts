import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'textwall';

export default class TextwallCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['twall'],
      label: 'text',
      metadata: {
        description: 'Textwallify some text',
        examples: [
          `${COMMAND_NAME} lol`,
        ],
        id: Formatter.Commands.FunTextwall.COMMAND_ID,
        type: CommandTypes.FUN,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunTextwall.CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: Formatter.Commands.FunTextwall.CommandArgs) {
    return Formatter.Commands.FunTextwall.createMessage(context, args);
  }
}
