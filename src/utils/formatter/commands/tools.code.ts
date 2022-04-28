import { Collections, Command, Interaction, Structures } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { utilitiesCodeRun } from '../../../api';
import {
  CodeLanguages,
  CodeLanguagesToName,
  EmbedBrands,
  EmbedColors,
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
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { content, error, stats } = await utilitiesCodeRun(context, {
    code: generateCodeFromLanguage(args.language, args.code),
    input: generateCodeStdin(context),
    language: args.language,
  });

  const language = args.language.toLowerCase().replace('_plus_plus', '++').replace('_sharp', '#');

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);

  let footer = `${toTitleCase(language)} Code Execution`;
  if (stats.time_service && 1000 <= stats.time_service) {
    const seconds = (stats.time_service / 1000).toFixed(1);
    footer = `${footer}, took ${seconds} seconds`;
  }
  embed.setFooter(footer, EmbedBrands.NOTSOBOT);

  const languageMarkupString = language.split('_').shift()!;
  if (error) {
    embed.setColor(EmbedColors.ERROR);
    embed.setDescription(Markup.codeblock(error, {language: languageMarkupString}));
  } else if (content) {
    embed.setDescription(Markup.codeblock(content, {language: languageMarkupString}));
  } else {
    embed.setDescription('No Content');
  }

  return editOrReply(context, {embed});
}
