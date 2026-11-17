import * as moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { mediaAVToolsTranscribe } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  MOMENT_FORMAT,
  TranscribeFileFormats,
} from '../../../constants';
import { DisplayPayload, displayReply, joinArrayWithNouns, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.transcribe';

export interface CommandArgs {
  // also attach the transcription as a subtitles or lyrics file (`transcription.lrc`), `highlight` for the word being
  // said (ass) or each word's time (lrc)
  file?: TranscribeFileFormats,
  highlight?: boolean,
  isEphemeral?: boolean,
  // the file's lines translated to this language (no highlight then), an srt when no `file` was picked
  translate?: GoogleLocales | null,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, languageName, translate, translateMaybe } = await getTranslator(context);

  const fileFormat = args.file || ((args.translate) ? TranscribeFileFormats.SRT : undefined);
  const { duration, file: transcriptionFile, languages, text } = await mediaAVToolsTranscribe(context, {
    fileFormat,
    highlight: (fileFormat) ? args.highlight : undefined,
    translate: (fileFormat) ? args.translate || undefined : undefined,
    url: args.url,
  });

  const durationText = moment.duration(duration, 'milliseconds').format(MOMENT_FORMAT, DateMomentOptions);
  // the api returns language codes ("en") now, older responses had full names ("english")
  const languageTitle = joinArrayWithNouns(languages.map((x) => {
    let englishText = toTitleCase(x);
    try {
      const name = new Intl.DisplayNames(['en'], {type: 'language'}).of(x);
      if (name && name.toLowerCase() !== x.toLowerCase()) {
        englishText = name;
      }
    } catch(error) {
      // full names aren't valid codes and throw a RangeError
    }
    return languageName(x, englishText, {capitalize: true});
  }));
  const title = translate('tools_transcribe.transcription_from_audio', {durationText: durationText, languageTitle: languageTitle}).trim();

  let description: string = '';
  const files: Array<{filename: string, value: string}> = [];
  if (text) {
    if (2000 < text.length) {
      files.push({filename: 'transcription.txt', value: text});
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

  if (text && fileFormat && transcriptionFile) {
    const suffix = (args.translate) ? `.${args.translate}` : '';
    files.push({filename: `transcription${suffix}.${fileFormat}`, value: transcriptionFile});
  }

  return displayReply(context, {...payload, ephemeral: args.isEphemeral, files: (files.length) ? files : undefined});

}
