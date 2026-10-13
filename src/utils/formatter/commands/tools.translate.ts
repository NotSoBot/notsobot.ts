import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleTranslate } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
} from '../../../constants';
import { DisplayPayload, displayReply, splitTextByAmount } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.translate';

export interface CommandArgs {
  from?: GoogleLocales | null,
  isEphemeral?: boolean,
  text: string,
  to?: GoogleLocales | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  const { language, languageName, translate } = await getTranslator(context);

  const {
    from_language: fromLanguage,
    translated_language: translatedLanguage,
    translated_text: translatedText,
  } = await googleTranslate(context, {
    from: args.from || undefined,
    text: args.text,
    to: args.to || undefined,
  });

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = 'Google Translate';
  payload.footerIconUrl = EmbedBrands.GOOGLE_GO;

  let fromLanguageText: string = fromLanguage;
  if (fromLanguage in GoogleLocalesText) {
    fromLanguageText = GoogleLocalesText[fromLanguage];
  }
  let translatedLanguageText: string = translatedLanguage;
  if (translatedLanguage in GoogleLocalesText) {
    translatedLanguageText = GoogleLocalesText[translatedLanguage];
  }
  const fromLanguageName = languageName(fromLanguage, fromLanguageText);
  const fromLanguageTitle = languageName(fromLanguage, fromLanguageText, {capitalize: true});
  const translatedLanguageName = languageName(translatedLanguage, translatedLanguageText);
  const translatedLanguageTitle = languageName(translatedLanguage, translatedLanguageText, {capitalize: true});
  payload.title = translate('tools.translate.title', {from: fromLanguageName, to: translatedLanguageName});

  const files: Array<{filename: string, value: string}> = [];

  const shouldShowInput = (isFromInteraction && translatedText !== args.text);
  const totalLength = args.text.length + translatedText.length;
  if (totalLength <= 4000) {
    if (shouldShowInput) {
      // 1024 - 10 ('```\n\n```')
      const parts = splitTextByAmount(args.text, 1014, '');
      payload.fields!.push({name: fromLanguageTitle, value: Markup.codeblock(parts.shift()!)});
      for (let part of parts) {
        payload.fields!.push({name: '\u200b', value: Markup.codeblock(part)});
      }
    }
  
    {
      // 1024 - 10 ('```\n\n```')
      const parts = splitTextByAmount(translatedText, 1014, '');
      const title = (fromLanguage === translatedLanguage || shouldShowInput) ? translatedLanguageTitle : `${fromLanguageTitle} -> ${translatedLanguageTitle}`;
      payload.fields!.push({name: title, value: Markup.codeblock(parts.shift() as string)});
      for (let part of parts) {
        payload.fields!.push({name: '\u200b', value: Markup.codeblock(part)});
      }
    }
  } else {
    if (shouldShowInput) {
      files.push({filename: `translate-from-${fromLanguageText}.txt`, value: args.text});
    }
    files.push({filename: `translate-to-${translatedLanguage}.txt`, value: translatedText});
    payload.description = [
      translate('tools.translate.input_characters', {count: args.text.length.toLocaleString(language)}),
      translate('tools.translate.result_characters', {count: translatedText.length.toLocaleString(language)}),
    ].join('\n');
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral, files});
}
