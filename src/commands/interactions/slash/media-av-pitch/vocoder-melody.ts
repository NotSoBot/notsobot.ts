import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MediaAudioVocoderSynths, MediaAudioVocoderSynthsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { replyWarning } from '../../../errors';
import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


const DEFAULT_BPM = Formatter.Commands.MediaAVManipulationAudioVocoderMelody.DEFAULT_BPM;
const DEFAULT_SYNTH = Formatter.Commands.MediaAVManipulationAudioVocoderMelody.DEFAULT_SYNTH;

export const COMMAND_NAME = 'vocoder-melody';

export interface CommandArgsBefore {
  bands?: number,
  bpm?: number,
  midi?: Structures.Attachment | string,
  midiUrl?: string,
  notes?: string,
  synth?: MediaAudioVocoderSynths,
  url?: null | string,
}

export class MediaAVAudioVocoderMelodyCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Make the voice in an Audio or Video sing a melody, from notes or a MIDI file';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.vocoder_melody.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioVocoderMelody.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.vocoder_melody.name');

  constructor() {
    super({
      options: [
        {name: 'notes', description: 'Notes one after another, like C4 E4 G4:2 C4+E4+G4:4 r', ...I18n.optionLocalizations('commands.media_av.audio.vocoder_melody.notes')},
        {name: 'midi', description: 'MIDI file (.mid) to sing instead of the notes', ...I18n.optionLocalizations('commands.media_av.audio.vocoder_melody.midi'), type: ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'midi-url', description: 'MIDI file URL, instead of the file', ...I18n.optionLocalizations('commands.media_av.audio.vocoder_melody.midi_url'), label: 'midiUrl'},
        {name: 'bpm', description: `Beats per minute for the notes, 20 to 400 (Default: ${DEFAULT_BPM})`, ...I18n.optionLocalizations('commands.media_av.audio.vocoder_melody.bpm'), type: 'number'},
        {
          name: 'synth',
          description: `Sound the melody is played with (Default: ${DEFAULT_SYNTH})`,
          ...I18n.optionLocalizations('commands.media_av.audio.vocoder_melody.synth'),
          choices: Parameters.Slash.oneOf({
            choices: MediaAudioVocoderSynths,
            descriptions: MediaAudioVocoderSynthsToText,
            defaultChoice: DEFAULT_SYNTH,
            localizationKey: 'choices.media_audio_vocoder_synths',
          }),
        },
        {name: 'bands', description: 'Frequency bands, fewer sounds more robotic, 1 to 512 (Default: 75)', ...I18n.optionLocalizations('commands.media_av.audio.vocoder_melody.bands'), type: Number},
      ],
    }, {skipFiles: Parameters.MIDI_FILE_EXTENSIONS});
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (!getMidiUrl(args) && !args.notes) {
      const { translate } = await I18n.getTranslator(context);
      return replyWarning(context, translate('errors.no_melody_found'), {ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return super.onBeforeRun(context, args) && (!!getMidiUrl(args) || !!args.notes);
  }

  async run(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return Formatter.Commands.MediaAVManipulationAudioVocoderMelody.createMessage(context, {
      bands: args.bands,
      bpm: args.bpm,
      midi: getMidiUrl(args),
      notes: args.notes,
      synth: args.synth,
      url: args.url!,
    });
  }
}


function getMidiUrl(args: CommandArgsBefore): null | string {
  // the option comes back as the resolved attachment
  if (args.midi instanceof Structures.Attachment) {
    return args.midi.url || args.midi.proxyUrl || null;
  }
  return args.midiUrl || null;
}
