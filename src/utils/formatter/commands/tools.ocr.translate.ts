import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { RequestFile } from 'detritus-rest';

import { googleContentVisionOCR, googleTranslate } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
} from '../../../constants';
import { DisplayPayload, displayReply, languageCodeToText, splitTextByAmount } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.ocr.translate';

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
  const { language, languageName, translate } = await getTranslator(context);
  if (!args.file && !args.url) {
    return displayReply(context, {description: translate('tools.translate.missing_input')});
  }


  const { annotation } = await googleContentVisionOCR(context, {
    file: args.file,
    url: args.url,
  });

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools.translate.footer_ocr');
  payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

  if (args.url) {
    payload.thumbnail = args.url;
  }

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
      untranslated,
    } = await googleTranslate(context, {
      from: locale,
      text: annotation.description.slice(0, 5000),
      to: args.to || undefined,
    });

    const fromLanguageText = languageCodeToText(fromLanguage);
    const translatedLanguageText = languageCodeToText(translatedLanguage);
    const fromLanguageName = languageName(fromLanguage, fromLanguageText);
    const fromLanguageTitle = languageName(fromLanguage, fromLanguageText, {capitalize: true});
    const translatedLanguageName = languageName(translatedLanguage, translatedLanguageText);
    const translatedLanguageTitle = languageName(translatedLanguage, translatedLanguageText, {capitalize: true});
    payload.title = translate((untranslated) ? 'tools.translate.title_untranslated' : 'tools.translate.title', {from: fromLanguageName, to: translatedLanguageName});

    const shouldShowInput = (translatedText !== annotation.description);
    const totalLength = annotation.description.length + translatedText.length;
    if (totalLength <= 4000) {
      if (shouldShowInput) {
        // 1024 - 10 ('```\n\n```')
        const parts = splitTextByAmount(annotation.description, 1014, '');
        payload.fields!.push({name: fromLanguageTitle, value: Markup.codeblock(parts.shift() as string)});
        for (let part of parts) {
          payload.fields!.push({name: '\u200b', value: Markup.codeblock(part)});
        }
      }

      {
        // 1024 - 10 ('```\n\n```')
        const parts = splitTextByAmount(translatedText, 1014, '');
        let title = (fromLanguage === translatedLanguage || shouldShowInput) ? translatedLanguageTitle : `${fromLanguageTitle} -> ${translatedLanguageTitle}`;
        if (untranslated) {
          // it's still the input text, google didn't translate it
          title = fromLanguageTitle;
        }
        payload.fields!.push({name: title, value: Markup.codeblock(parts.shift() as string)});
        for (let part of parts) {
          payload.fields!.push({name: '\u200b', value: Markup.codeblock(part)});
        }
      }
    } else {
      if (shouldShowInput) {
        files.push({filename: `translate-from-${fromLanguageText.toLowerCase()}.txt`, value: annotation.description});
      }
      files.push({filename: `translate-to-${translatedLanguageText.toLowerCase()}.txt`, value: translatedText});
      payload.description = [
        translate('tools.translate.input_characters', {count: annotation.description.length.toLocaleString(language)}),
        translate('tools.translate.result_characters', {count: translatedText.length.toLocaleString(language)}),
      ].join('\n');
    }
  } else {
    payload.color = EmbedColors.ERROR;
    payload.description = translate('tools.ocr.no_text');
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral, files});
}
