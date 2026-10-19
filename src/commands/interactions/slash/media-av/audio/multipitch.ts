import { Interaction } from 'detritus-client';

import { MediaAudioMultiPitchEngines, MediaAudioMultiPitchEnginesToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


const DEFAULT_ENGINE = Formatter.Commands.MediaAVManipulationAudioMultiPitch.DEFAULT_ENGINE;

export const COMMAND_NAME = 'multipitch';

export class MediaAVAudioMultiPitchCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Pitch shift an Audio or Video by semitones without changing its speed, or mix pitches into a chord';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.multipitch.description');
  metadata = {
    credits: Formatter.Commands.MediaAVManipulationAudioMultiPitch.CREDITS,
    id: Formatter.Commands.MediaAVManipulationAudioMultiPitch.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.multipitch.name');

  constructor() {
    super({
      options: [
        {name: 'semitones', description: 'Semitones split by commas, 0 is the original, -48 to 48 each (Default: 0,7,12)', ...I18n.optionLocalizations('commands.media_av.audio.multipitch.semitones')},
        {name: 'normalize', description: 'Keep the mixed chord from getting louder than the original', ...I18n.optionLocalizations('commands.media_av.audio.multipitch.normalize'), type: Boolean},
        {
          name: 'engine',
          description: `Pitch shifter each copy is made with (Default: ${DEFAULT_ENGINE})`,
          ...I18n.optionLocalizations('commands.media_av.audio.multipitch.engine'),
          choices: Parameters.Slash.oneOf({
            choices: MediaAudioMultiPitchEngines,
            descriptions: MediaAudioMultiPitchEnginesToText,
            defaultChoice: DEFAULT_ENGINE,
            localizationKey: 'choices.media_audio_multipitch_engines',
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioMultiPitch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioMultiPitch.createMessage(context, args);
  }
}
