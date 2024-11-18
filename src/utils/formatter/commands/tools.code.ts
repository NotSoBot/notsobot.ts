import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { utilitiesCodeRun } from '../../../api';
import {
  CodeLanguages,
  CodeLanguagesToName,
  EmbedBrands,
  EmbedColors,
  CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND,
  MAX_MEMBERS_SAFE,
} from '../../../constants';

import {
  createUserEmbed,
  editOrReply,
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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { code, urls } = generateCodeFromLanguage(args.language, args.code);
  const { language, result, took, version } = await utilitiesCodeRun(context, {
    code,
    language: args.language,
    stdin: generateCodeStdin(context),
    urls: Object.values(urls),
    version: args.version || undefined,
  });

  const title = args.language.toLowerCase().replace('_plus_plus', '++').replace('_sharp', '#');

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);

  let footer = `${toTitleCase(title)} (${version}) Code Execution`;
  if (1000 <= took) {
    const seconds = (took / 1000).toFixed(1);
    footer = `${footer}, took ${seconds} seconds`;
  }
  embed.setFooter(footer, EmbedBrands.NOTSOBOT);

  const languageMarkupString = language.extension;
  if (result.error && (!result.error.startsWith(CODE_EXECUTION_FFMPEG_DEFAULT_STDERR_PREPEND) && !result.error.includes('Input'))) {
    embed.setColor(EmbedColors.ERROR);
    embed.setDescription(Markup.codeblock(result.error, {language: languageMarkupString}));
  } else if (result.output) {
    embed.setDescription(Markup.codeblock(result.output, {language: languageMarkupString}));
  } else if (!result.files.length) {
    embed.setDescription('No Content');
  }

  const files: Array<{filename: string, value: Buffer}> = [];
  if (result.files.length) {
    let currentFileSize = 0;
    const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE);
    for (let file of result.files) {
      const { filename, size, value } = file;
      if (filename === '__internals__.json') {
        continue;
      }
      if (maxFileSize <= currentFileSize + size) {
        throw new Error(`Attachments surpassed max file size of ${maxFileSize} bytes`);
      }
      currentFileSize += size;

      files.push({filename, value: Buffer.from(value, 'base64')});
    }
  }

  return editOrReply(context, {embed, files});
}
