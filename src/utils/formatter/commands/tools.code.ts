import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { utilitiesCodeRun } from '../../../api';
import { CommandResults, setCommandResult } from '../../../commandresults';
import { getTranslator } from '../../i18n';
import {
  CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND,
  CodeLanguages,
  CodeLanguagesToName,
  EmbedBrands,
  EmbedColors,
  MAX_MEMBERS_SAFE,
} from '../../../constants';

import * as DefaultParameters from '../../defaultparameters';
import {
  DisplayPayload,
  displayReply,
  generateCodeFromLanguage,
  generateCodeStdin,
  toTitleCase,
} from '../../tools';



export const languagesText = Object.values(CodeLanguages).map((x: any) => {
  if (x in CodeLanguagesToName) {
    return Markup.codestring(toTitleCase((CodeLanguagesToName as any)[x][0]));
  }
  return Markup.codestring(toTitleCase(x));
}).sort().join(', ');


export const COMMAND_ID = 'tools.code';

export interface CommandArgs {
  code: string,
  language: CodeLanguages,
  version: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language: locale, translate, translateMaybe } = await getTranslator(context);

  const { code, urls } = generateCodeFromLanguage(args.language, args.code);
  const { language, result, took, version } = await utilitiesCodeRun(context, {
    code,
    language: args.language,
    safe: DefaultParameters.safe(context),
    stdin: generateCodeStdin(context),
    urls: Object.values(urls),
    version: args.version || undefined,
  });

  const title = args.language.toLowerCase().replace('_plus_plus', '++').replace('_sharp', '#');

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;

  let footer = translate('tools_code.code_execution', {value: toTitleCase(title), version: version});
  if (1000 <= took) {
    const seconds = (took / 1000).toFixed(1);
    footer = translate('tools_code.took_seconds', {footer: footer, seconds: seconds});
  }
  payload.footer = footer;
  payload.footerIconUrl = EmbedBrands.NOTSOBOT;

  const files: Array<{filename: string, value: Buffer}> = [];

  const languageMarkupString = language.extension;
  if (result.error) {// && (!result.error.startsWith(CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND) && !result.error.includes('Input'))) {
    // the command worked, the code didn't
    setCommandResult(context, CommandResults.SCRIPT_ERROR);
    payload.color = EmbedColors.ERROR;
    if (1990 < result.error.length) {
      files.push({filename: 'error.txt', value: Buffer.from(result.error)});
      payload.description = translate('tools_code.uploaded_the_error_log_to_a_txt');
    } else {
      payload.description = Markup.codeblock(result.error, {language: languageMarkupString}); 
    }
  } else if (result.output) {
    if (1990 < result.output.length) {
      files.push({filename: 'output.txt', value: Buffer.from(result.output)});
      payload.description = translate('tools_code.uploaded_the_long_output_to_a_txt');
    } else {
      payload.description = Markup.codeblock(result.output, {language: languageMarkupString}); 
    }
  } else if (result.files.length) {
    payload.description = translate('tools_code.file_outputted', {files_count: result.files.length.toLocaleString(locale)});
  } else if (!result.files.length) {
    payload.description = translate('tools_code.no_content');
  }

  if (result.files.length) {
    let currentFileSize = 0;
    const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE);
    for (let fileResponse of result.files) {
      const { filename, value } = fileResponse.file;
      const { size } = fileResponse.file.metadata;
      if (filename === '__internals__.json') {
        continue;
      }
      if (maxFileSize <= currentFileSize + size) {
        throw new Error(translate('tools_code.attachments_surpassed_max_file_size_of_bytes', {maxFileSize: maxFileSize}));
      }
      currentFileSize += size;

      files.push({filename, value: Buffer.from(value || '', 'base64')});
    }
  }

  return displayReply(context, {...payload, files});
}
