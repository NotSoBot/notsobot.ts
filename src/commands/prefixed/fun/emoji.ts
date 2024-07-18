import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, EmojiTypes } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


const CHOICES = Object.values(EmojiTypes);

export const COMMAND_NAME = 'emoji';

export default class EmojiCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['e'],
      args: [
        {
          name: 'size',
          default: 512,
          type: Parameters.number({max: 2048, min: 8}),
        },
        {
          name: 'type',
          choices: CHOICES,
          default: Formatter.Commands.FunEmoji.DEFAULT_EMOJI_TYPE,
          help: `Must be one of: (${CHOICES.join(', ')})`,
          type: Parameters.stringLowerCase(),
        },
      ],
      default: DefaultParameters.replyString,
      label: 'emojis',
      metadata: {
        category: CommandCategories.FUN,
        description: 'make emoji big!',
        examples: [
          `${COMMAND_NAME} 😩`,
          `${COMMAND_NAME} 😩 -type apple`,
          `${COMMAND_NAME} 😩 -type google -size 1024`,
        ],
        id: Formatter.Commands.FunEmoji.COMMAND_ID,
        usage: '<emojis> (-type <EmojiTypes>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.FunEmoji.CommandArgs) {
    return !!args.emojis;
  }

  async run(context: Command.Context, args: Formatter.Commands.FunEmoji.CommandArgs) {
    return Formatter.Commands.FunEmoji.createMessage(context, args);
  }
}
