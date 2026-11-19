import { Interaction } from 'detritus-client';

import { MediaNoiseColors, MediaNoiseColorsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'noise';

export class MediaAVNoiseCommand extends BaseInteractionCommandOption {
  description = 'Make an audio file of noise';
  descriptionLocalizations = I18n.localizations('commands.media_av.noise.description');
  metadata = {
    id: Formatter.Commands.MediaACreateNoise.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.noise.name');

  constructor() {
    super({
      options: [
        {
          name: 'duration',
          description: 'Seconds, 1 to 600 (Default: 10)',
          ...I18n.optionLocalizations('commands.media_av.noise.duration'),
          maxValue: 600,
          minValue: 1,
          type: 'number',
        },
        {
          name: 'color',
          description: 'The kind of noise (Default: White)',
          ...I18n.optionLocalizations('commands.media_av.noise.color'),
          choices: Parameters.Slash.oneOf({choices: MediaNoiseColors, descriptions: MediaNoiseColorsToText, localizationKey: 'choices.media_noise_colors', defaultChoice: MediaNoiseColors.WHITE}),
        },
        {
          name: 'amplitude',
          description: 'How loud, 0 to 1 (Default: 1)',
          ...I18n.optionLocalizations('commands.media_av.noise.amplitude'),
          maxValue: 1,
          minValue: 0,
          type: 'number',
        },
        {
          name: 'sample-rate',
          description: '8000 to 48000 (Default: 44100)',
          ...I18n.optionLocalizations('commands.media_av.noise.sample_rate'),
          label: 'samplerate',
          maxValue: 48000,
          minValue: 8000,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaACreateNoise.CommandArgs) {
    return Formatter.Commands.MediaACreateNoise.createMessage(context, args);
  }
}
