import { Interaction } from 'detritus-client';

import { MediaNoiseColors, MediaNoiseColorsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'audio-noise';

export class MediaAIVToolsAudioNoiseCommand extends BaseInteractionMediaCommandOption {
  description = 'Mix noise into a media\'s audio, an image becomes a video with it';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.audio_noise.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationAudioNoise.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv_tools.audio_noise.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: 'The kind of noise (Default: White)',
          ...I18n.optionLocalizations('commands.media_aiv_tools.audio_noise.color'),
          choices: Parameters.Slash.oneOf({choices: MediaNoiseColors, descriptions: MediaNoiseColorsToText, localizationKey: 'choices.media_noise_colors', defaultChoice: MediaNoiseColors.WHITE}),
        },
        {
          name: 'amplitude',
          description: 'How loud, 0 to 1 (Default: 1)',
          ...I18n.optionLocalizations('commands.media_aiv_tools.audio_noise.amplitude'),
          maxValue: 1,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'sample-rate',
          description: '8000 to 48000 (Default: 44100)',
          ...I18n.optionLocalizations('commands.media_aiv_tools.audio_noise.sample_rate'),
          label: 'samplerate',
          maxValue: 48000,
          minValue: 8000,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationAudioNoise.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAudioNoise.createMessage(context, args);
  }
}
