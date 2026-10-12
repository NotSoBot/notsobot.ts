import * as moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { mediaAVToolsTranscribe } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  StatusEmojis,
  MOMENT_FORMAT,
} from '../../../constants';
import { createUserEmbed, editOrReply, joinArrayWithNouns, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.transcribe';

export interface CommandArgs {
  isEphemeral?: boolean,
  noembed?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

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

  if (args.noembed) {
    if (!text) {
      return editOrReply(context, {
        content: `${StatusEmojis.WARNING} ${translate('tools_transcribe.no_text_detected')}`,
        flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
      });
    }

    return editOrReply(context, {
      content: [title, description].join('\n'),
      flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
    });
  } else {
    const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setFooter(translate('tools_transcribe.transcription'), EmbedBrands.OPENAI_WHISPER);

    if (text) {
      embed.setTitle(title);
      embed.setDescription(description);
    } else {
      embed.setColor(EmbedColors.ERROR);
      embed.setDescription(translate('tools_transcribe.no_speech_detected'));
    }

    return editOrReply(context, {
      embed,
      file,
      flags: (args.isEphemeral) ? MessageFlags.EPHEMERAL : undefined,
    });
  }
}
