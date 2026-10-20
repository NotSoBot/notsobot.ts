import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'xd';

export default class XDCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Draw a big XD out of up to 3 words',
        examples: [
          `${COMMAND_NAME} lol`,
        ],
        id: Formatter.Commands.FunXD.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.targetTextWithParsedMentions,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunXD.CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: Formatter.Commands.FunXD.CommandArgs) {
    return Formatter.Commands.FunXD.createMessage(context, args);
  }
}
