import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { RequestFile } from 'detritus-rest';

import { googleTranslate, mediaAVToolsTranscribe } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
} from '../../../constants';
import { createUserEmbed, editOrReply, languageCodeToText, splitTextByAmount } from '../../../utils';


export const COMMAND_ID = 'tools.transcribe.translate';

export interface CommandArgs {
  file?: RequestFile,
  isEphemeral?: boolean,
  to?: GoogleLocales | null,
  url?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (!args.file && !args.url) {
    return editOrReply(context, 'Internal Error, one of file or url must be provided');
  }

  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { duration, text } = await mediaAVToolsTranscribe(context, {
    file: args.file,
    url: args.url,
  });

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('Google Translate from Transcription', EmbedBrands.GOOGLE_GO);

  const files: Array<{filename: string, value: string}> = [];
  if (text) {
    const {
      from_language: fromLanguage,
      translated_language: translatedLanguage,
      translated_text: translatedText,
    } = await googleTranslate(context, {
      text: text,
      to: args.to || undefined,
    });

    const fromLanguageText = languageCodeToText(fromLanguage);
    const translatedLanguageText = languageCodeToText(translatedLanguage);
    embed.setTitle(`Translated from ${fromLanguageText} to ${translatedLanguageText}`);

    const shouldShowInput = (translatedText !== text);
    const totalLength = text.length + translatedText.length;
    if (totalLength <= 4000) {
      if (shouldShowInput) {
        // 1024 - 10 ('```\n\n```')
        const parts = splitTextByAmount(text, 1014, '');
        embed.addField(fromLanguageText, Markup.codeblock(parts.shift() as string));
        for (let part of parts) {
          embed.addField('\u200b', Markup.codeblock(part));
        }
      }

      {
        // 1024 - 10 ('```\n\n```')
        const parts = splitTextByAmount(translatedText, 1014, '');
        const title = (fromLanguage === translatedLanguage || shouldShowInput) ? translatedLanguageText : `${fromLanguageText} -> ${translatedLanguageText}`;
        embed.addField(title, Markup.codeblock(parts.shift() as string));
        for (let part of parts) {
          embed.addField('\u200b', Markup.codeblock(part));
        }
      }
    } else {
      if (shouldShowInput) {
        files.push({filename: `translate-from-${fromLanguageText}.txt`, value: text});
      }
      files.push({filename: `translate-to-${translatedLanguage}.txt`, value: translatedText});
      embed.setDescription([
        `Input: ${text.length.toLocaleString()} Characters`,
        `Result: ${translatedText.length.toLocaleString()} Characters`,
      ].join('\n'));
    }
  } else {
    embed.setColor(EmbedColors.ERROR);
    embed.setDescription('No speech detected');
  }

  return editOrReply(context, {
    embed,
    files,
    flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
  });
}
