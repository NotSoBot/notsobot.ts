import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { googleContentVisionOCR } from '../../../api';
import {
  EmbedBrands,
  EmbedColors,
} from '../../../constants';
import { DisplayPayload, displayReply, languageCodeToText } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'tools.ocr';

export interface CommandArgs {
  isEphemeral?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, languageName, translate } = await getTranslator(context);

  const { annotation } = await googleContentVisionOCR(context, {url: args.url});

  let description: string = '';
  let file: {filename: string, value: string} | undefined;
  if (annotation) {
    if (2000 < annotation.description.length) {
      file = {filename: 'ocr.txt', value: annotation.description};
      description = translate('tools.ocr.characters', {count: annotation.description.length.toLocaleString(language)});
      /*
      try {
        const upload = await context.rest.request({
          files: [{filename: 'ocr.txt', key: 'file', value: annotation.description}],
          method: 'post',
          url: 'https://api.files.gg/files',
        });
        description = upload.urls.main;
      } catch(error) {
        description = Markup.codeblock(annotation.description);
      }
      */
    } else {
      description = Markup.codeblock(annotation.description);
    }
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools.ocr.footer');
  payload.footerIconUrl = EmbedBrands.GOOGLE_GO;
  payload.thumbnail = args.url;

  if (annotation) {
    payload.title = translate('tools.ocr.title', {language: languageName(annotation.locale, languageCodeToText(annotation.locale))});
    payload.description = description;
  } else {
    payload.color = EmbedColors.ERROR;
    payload.description = translate('tools.ocr.no_text');
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral, files: (file) ? [file] : undefined});

}
