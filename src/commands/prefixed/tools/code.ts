import { Command, CommandClient } from 'detritus-client';

import { CodeLanguages, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply, getCodeLanguage } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  code: string,
}

export const COMMAND_NAME = 'code';

export default class CodeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'language', aliases: ['l']},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Execute code',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} \`\`\`js console.log('lol')\`\`\``,
          `${COMMAND_NAME} js console.log('lol');`,
        ],
        id: Formatter.Commands.ToolsCode.COMMAND_ID,
        usage: '<?language> <code>',
      },
      type: Parameters.targetText,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    let code = args.code;
    let language: CodeLanguages | null = null;
    let version: string | null = null;

    const index = code.search(/\s/);
    if (index !== -1) {
      let parsed = getCodeLanguage(code.slice(0, index));
      if (parsed) {
        code = code.slice(index);
        language = parsed.language;
        version = parsed.version;
      }
    }

    const codeblock = Parameters.codeblock(code);
    if (codeblock.language) {
      const parsed = getCodeLanguage(codeblock.language);
      if (parsed) {
        language = parsed.language;
        version = parsed.version || version;
      }
    }
    code = codeblock.text;

    if (!language) {
      return editOrReply(context, `Give me a valid language! (One of ${Formatter.Commands.ToolsCode.languagesText})`);
    }

    return Formatter.Commands.ToolsCode.createMessage(context, {code, language, version});
  }
}
