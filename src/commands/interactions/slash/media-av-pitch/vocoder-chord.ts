import { Interaction } from 'detritus-client';

import { MediaAudioVocoderSynths, MediaAudioVocoderSynthsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


const DEFAULT_CHORD = Formatter.Commands.MediaAVManipulationAudioVocoderChord.DEFAULT_CHORD;
const DEFAULT_SYNTH = Formatter.Commands.MediaAVManipulationAudioVocoderChord.DEFAULT_SYNTH;

export const COMMAND_NAME = 'vocoder-chord';

export class MediaAVAudioVocoderChordCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Make the voice in an Audio or Video sing a chord';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.vocoder_chord.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioVocoderChord.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.vocoder_chord.name');

  constructor() {
    super({
      options: [
        {name: 'chord', description: `Notes to sing, like C4,E4,G4 (Default: ${DEFAULT_CHORD})`, ...I18n.optionLocalizations('commands.media_av.audio.vocoder_chord.chord')},
        {
          name: 'synth',
          description: `Sound the chord is played with (Default: ${DEFAULT_SYNTH})`,
          ...I18n.optionLocalizations('commands.media_av.audio.vocoder_chord.synth'),
          choices: Parameters.Slash.oneOf({
            choices: MediaAudioVocoderSynths,
            descriptions: MediaAudioVocoderSynthsToText,
            defaultChoice: DEFAULT_SYNTH,
            localizationKey: 'choices.media_audio_vocoder_synths',
          }),
        },
        {name: 'bands', description: 'Frequency bands, fewer sounds more robotic, 1 to 512 (Default: 75)', ...I18n.optionLocalizations('commands.media_av.audio.vocoder_chord.bands'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVocoderChord.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVocoderChord.createMessage(context, args);
  }
}
