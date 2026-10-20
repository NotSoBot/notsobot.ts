import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'zalgo';

export default class ZalgoCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Zalgoify some text',
        examples: [
          `${COMMAND_NAME} hello world`,
        ],
        id: Formatter.Commands.FunZalgo.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunZalgo.CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: Formatter.Commands.FunZalgo.CommandArgs) {
    return Formatter.Commands.FunZalgo.createMessage(context, args);
  }
}
