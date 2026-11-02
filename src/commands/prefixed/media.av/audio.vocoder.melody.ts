import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaAudioVocoderSynths, MediaAudioVocoderSynthsToText } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { replyWarning } from '../../errors';
import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'vocodermelody';

export interface CommandArgsBefore {
  bands?: number,
  bpm?: number,
  notes?: string,
  synth?: MediaAudioVocoderSynths,
  url?: null | string,
}

export default class AudioVocoderMelodyCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['melodyvocoder', 'audio vocodermelody', 'a vocodermelody'],
      args: [
        {name: 'bpm', aliases: ['t'], type: 'float', metadata: {description: '20 to 400'}},
        {name: 'synth', aliases: ['s'], type: Parameters.oneOf({choices: MediaAudioVocoderSynths, descriptions: MediaAudioVocoderSynthsToText})},
        {name: 'bands', aliases: ['b'], type: Number, metadata: {description: '1 to 512'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Make the voice in an Audio or Video sing a melody, from notes or an attached MIDI file (.mid)',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 C4 E4 G4 C5:2 G4 E4:2 -bpm 160`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 A3+C4+E4:4 F3+A3+C4:4 -synth power`,
        ],
        id: Formatter.Commands.MediaAVManipulationAudioVocoderMelody.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <notes, or a .mid attached> (-bpm <float>) (-synth <choice>) (-bands <number>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: true, image: false, video: true, skipFiles: Parameters.MIDI_FILE_EXTENSIONS})},
        {name: 'notes', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    const midi = await Parameters.findFileUrl(context, Parameters.MIDI_FILE_EXTENSIONS);
    if (!midi && !args.notes?.trim()) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_melody_found'));
    }
    return Formatter.Commands.MediaAVManipulationAudioVocoderMelody.createMessage(context, {
      bands: args.bands,
      bpm: args.bpm,
      midi,
      notes: args.notes,
      synth: args.synth,
      url: args.url!,
    });
  }
}
