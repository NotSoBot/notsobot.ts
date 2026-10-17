import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';
import { RequestFile } from 'detritus-rest';

import { googleTranslate, mediaAVToolsTranscribe } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
} from '../../../constants';
import { DisplayPayload, displayReply, languageCodeToText, splitTextByAmount } from '../../../utils';
import { getTranslator } from '../../i18n';


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
  const { language, languageName, translate } = await getTranslator(context);
  if (!args.file && !args.url) {
    return displayReply(context, {description: translate('tools.translate.missing_input')});
  }


  const { duration, text } = await mediaAVToolsTranscribe(context, {
    file: args.file,
    url: args.url,
  });

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools.translate.footer_transcription');
  payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

  const files: Array<{filename: string, value: string}> = [];
  if (text) {
    const {
      from_language: fromLanguage,
      translated_language: translatedLanguage,
      translated_text: translatedText,
      untranslated,
    } = await googleTranslate(context, {
      text: text.slice(0, 5000),
      to: args.to || undefined,
    });

    const fromLanguageText = languageCodeToText(fromLanguage);
    const translatedLanguageText = languageCodeToText(translatedLanguage);
    const fromLanguageName = languageName(fromLanguage, fromLanguageText);
    const fromLanguageTitle = languageName(fromLanguage, fromLanguageText, {capitalize: true});
    const translatedLanguageName = languageName(translatedLanguage, translatedLanguageText);
    const translatedLanguageTitle = languageName(translatedLanguage, translatedLanguageText, {capitalize: true});
    payload.title = translate((untranslated) ? 'tools.translate.title_untranslated' : 'tools.translate.title', {from: fromLanguageName, to: translatedLanguageName});

    const shouldShowInput = (translatedText !== text);
    const totalLength = text.length + translatedText.length;
    if (totalLength <= 4000) {
      if (shouldShowInput) {
        // 1024 - 10 ('```\n\n```')
        const parts = splitTextByAmount(text, 1014, '');
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
        files.push({filename: `translate-from-${fromLanguageText.toLowerCase()}.txt`, value: text});
      }
      files.push({filename: `translate-to-${translatedLanguageText.toLowerCase()}.txt`, value: translatedText});
      payload.description = [
        translate('tools.translate.input_characters', {count: text.length.toLocaleString(language)}),
        translate('tools.translate.result_characters', {count: translatedText.length.toLocaleString(language)}),
      ].join('\n');
    }
  } else {
    payload.color = EmbedColors.ERROR;
    payload.description = translate('tools.translate.no_speech');
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral, files});
}
