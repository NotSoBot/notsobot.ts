import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'aesthetics';

export default class AestheticsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Aestheticfy some text',
        examples: [
          `${COMMAND_NAME} NotSoBot`,
        ],
        id: Formatter.Commands.FunAesthetics.COMMAND_ID,
        type: CommandTypes.FUN,
        usage: '<text>',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunAesthetics.CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: Formatter.Commands.FunAesthetics.CommandArgs) {
    return Formatter.Commands.FunAesthetics.createMessage(context, args);
  }
}
