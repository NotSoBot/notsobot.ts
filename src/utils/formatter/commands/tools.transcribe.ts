import * as moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { mediaAVToolsTranscribe } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  MOMENT_FORMAT,
} from '../../../constants';
import { DisplayPayload, displayReply, joinArrayWithNouns, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.transcribe';

export interface CommandArgs {
  isEphemeral?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { duration, languages, text } = await mediaAVToolsTranscribe(context, {
    url: args.url,
  });

  const durationText = moment.duration(duration, 'milliseconds').format(MOMENT_FORMAT, DateMomentOptions);
  const languageTitle = joinArrayWithNouns(languages.map((x) => toTitleCase(x)));
  const title = translate('tools_transcribe.transcription_from_audio', {durationText: durationText, languageTitle: languageTitle}).trim();

  let description: string = '';
  let file: {filename: string, value: string} | undefined;
  if (text) {
    if (2000 < text.length) {
      file = {filename: 'transcription.txt', value: text};
      description = translate('tools_transcribe.characters', {text_count: text.length.toLocaleString(language)});
    } else {
      description = Markup.codeblock(text);
    }
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = translate('tools_transcribe.transcription');
  payload.footerIconUrl = EmbedBrands.OPENAI_WHISPER;

  if (text) {
    payload.title = title;
    payload.description = description;
  } else {
    payload.color = EmbedColors.ERROR;
    payload.description = translate('tools_transcribe.no_speech_detected');
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral, files: (file) ? [file] : undefined});

}
