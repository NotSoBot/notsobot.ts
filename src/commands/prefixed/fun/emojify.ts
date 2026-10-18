import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'emojify';

export default class EmojifyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['efy'],
      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Draw text out of emojis, the first emoji given is the background and the second is the foreground',
        examples: [
          `${COMMAND_NAME} lol`,
          `${COMMAND_NAME} 🔥 💀 lol`,
        ],
        id: Formatter.Commands.FunEmojify.COMMAND_ID,
        usage: '?<background:emoji> ?<foreground:emoji> <text>',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunEmojify.CommandArgs) {
    return !!args.text && !!Formatter.Commands.FunEmojify.parseText(args.text).text.length;
  }

  run(context: Command.Context, args: Formatter.Commands.FunEmojify.CommandArgs) {
    return Formatter.Commands.FunEmojify.createMessage(context, args);
  }
}
