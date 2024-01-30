import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR, googleTranslate } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
} from '../../../constants';
import { createUserEmbed, editOrReply, languageCodeToText, splitTextByAmount } from '../../../utils';


export const COMMAND_ID = 'tools.ocr.translate';

export interface CommandArgs {
  isEphemeral?: boolean,
  to?: GoogleLocales | null,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { annotation } = await googleContentVisionOCR(context, {url: args.url});

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  embed.setColor(EmbedColors.DEFAULT);
  embed.setFooter('Google Translate from OCR', EmbedBrands.GOOGLE_GO);
  embed.setThumbnail(args.url);

  const files: Array<{filename: string, value: string}> = [];
  if (annotation) {
    let locale: GoogleLocales | undefined;
    if (annotation.locale in GoogleLocales) {
      locale = annotation.locale;
    }

    const {
      from_language: fromLanguage,
      translated_language: translatedLanguage,
      translated_text: translatedText,
    } = await googleTranslate(context, {
      from: locale,
      text: annotation.description,
      to: args.to || undefined,
    });

    const fromLanguageText = languageCodeToText(fromLanguage);
    const translatedLanguageText = languageCodeToText(translatedLanguage);
    embed.setTitle(`Translated from ${fromLanguageText} to ${translatedLanguageText}`);

    const shouldShowInput = (translatedText !== annotation.description);
    const totalLength = annotation.description.length + translatedText.length;
    if (totalLength <= 4000) {
      if (shouldShowInput) {
        // 1024 - 10 ('```\n\n```')
        const parts = splitTextByAmount(annotation.description, 1014, '');
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
        files.push({filename: `translate-from-${fromLanguageText}.txt`, value: annotation.description});
      }
      files.push({filename: `translate-to-${translatedLanguage}.txt`, value: translatedText});
      embed.setDescription([
        `Input: ${annotation.description.length.toLocaleString()} Characters`,
        `Result: ${translatedText.length.toLocaleString()} Characters`,
      ].join('\n'));
    }
  } else {
    embed.setColor(EmbedColors.ERROR);
    embed.setDescription('No text detected');
  }

  return editOrReply(context, {
    embed,
    files,
    flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
  });
}
