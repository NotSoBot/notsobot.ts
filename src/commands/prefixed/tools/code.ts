import { Command, CommandClient } from 'detritus-client';

import { CodeLanguages, CommandCategories } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply, getCodeLanguage } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgs {
  code: string,
  language?: string,
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
        category: CommandCategories.UTILITY,
        pipeable: true,
        description: 'Execute code',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} \`\`\`js console.log('lol')\`\`\``,
          `${COMMAND_NAME} js console.log('lol');`,
        ],
        id: Formatter.Commands.ToolsCode.COMMAND_ID,
        usage: '?<language> <code> (-language <string>)',
      },
      type: Parameters.targetText,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    let { code, language, version } = parseCode(args.code);

    // typed code always runs, attachments are copied into `./input` (`$FILE_1`...) for it to read
    // with nothing typed but a language, the first text attachment is the code instead
    const attachments = Array.from(context.message.attachments.values());
    let codeAttachmentId: string | null = null;
    if (!code.trim()) {
      const attachment = attachments.find((x) => x.contentType && x.contentType.split('/')[0] === 'text');
      if (attachment) {
        codeAttachmentId = attachment.id;
        const response = await context.rest.get(attachment.url, {dataOnly: false});
        const parsed = parseCode(await response.text());
        code = parsed.code;
        if (!language) {
          const fromFile = parsed.language ? parsed : getCodeLanguage(attachment.filename.split('.').pop()!);
          if (fromFile) {
            language = fromFile.language;
            version = fromFile.version;
          }
        }
      }
    }

    const files = attachments
      .filter((x) => x.id !== codeAttachmentId)
      .map((x) => ({filename: x.filename, url: x.url}));

    // `-language` wins over anything detected from the code or attachment
    if (args.language) {
      const parsed = getCodeLanguage(args.language.trim());
      if (!parsed) {
        const { translate } = await I18n.getTranslator(context);
        return displayReply(context, {description: translate('tools.code.invalid_language', {languages: Formatter.Commands.ToolsCode.languagesText})});
      }
      language = parsed.language;
      version = parsed.version || null;
    }

    if (!language) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: translate('tools.code.invalid_language', {languages: Formatter.Commands.ToolsCode.languagesText})});
    }

    return Formatter.Commands.ToolsCode.createMessage(context, {code, files, language, version});
  }
}


// `<language> <code>` and/or a codeblock's language, the codeblock's wins
function parseCode(value: string): {code: string, language: CodeLanguages | null, version: string | null} {
  let code = value;
  let language: CodeLanguages | null = null;
  let version: string | null = null;

  const trimmed = code.trim();
  const index = trimmed.search(/\s/);
  const first = getCodeLanguage((index === -1) ? trimmed : trimmed.slice(0, index));
  if (first) {
    code = (index === -1) ? '' : trimmed.slice(index);
    language = first.language;
    version = first.version;
  }

  const codeblock = Parameters.codeblock(code);
  if (codeblock.language) {
    const parsed = getCodeLanguage(codeblock.language);
    if (parsed) {
      language = parsed.language;
      version = parsed.version || version;
    }
  }
  return {code: codeblock.text, language, version};
}
