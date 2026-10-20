import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  text: string,
}

export const COMMAND_NAME = 'unicode';

export default class UnicodeCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['chars', 'codepoints'],
      label: 'text',
      metadata: {
        category: CommandCategories.UTILITY,
        description: `Show the Unicode name and code point of each character, up to ${Formatter.Commands.ToolsUnicode.MAX_CHARACTERS}`,
        examples: [
          `${COMMAND_NAME} ✓`,
          `${COMMAND_NAME} 🏳️‍🌈`,
        ],
        id: Formatter.Commands.ToolsUnicode.COMMAND_ID,
        usage: '<text>',
      },
      type: Parameters.targetText,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return !!args.text;
  }

  run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ToolsUnicode.createMessage(context, args);
  }
}
