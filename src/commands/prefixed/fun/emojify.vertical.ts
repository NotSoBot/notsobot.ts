import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'emojify vertical';

export default class EmojifyVerticalCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['emojify v', 'emojify vert', 'efy vertical', 'efy v', 'efy vert'],
      label: 'text',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Draw text out of emojis top to bottom, the first emoji given is the background and the second is the foreground',
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
    return Formatter.Commands.FunEmojify.createMessage(context, {...args, vertical: true});
  }
}
