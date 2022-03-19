import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply, getCodeLanguage } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  code: {language?: string, text: string},
  language?: string,
}

export interface CommandArgs {
  code: {language?: string, text: string},
  language: string,
}

export const COMMAND_NAME = 'code';

export default class CodeCommand extends BaseCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'language', aliases: ['l']},
      ],
      metadata: {
        description: 'Execute code',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} \`\`\`js console.log('lol')\`\`\``,
          `${COMMAND_NAME} console.log('lol'); -language js`,
        ],
        type: CommandTypes.TOOLS,
        usage: '<code> (-language <language>)',
      },
      type: Parameters.codeblock,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const language = getCodeLanguage(args.code.language || args.language);
    if (!language) {
      return editOrReply(context, 'Give me a valid language!');
    }
    return Formatter.Commands.ToolsCode.createMessage(context, {
      code: args.code.text,
      language,
    });
  }
}
