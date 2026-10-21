import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'vegas-wave';

export class MediaIVVegasWaveCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Bend an Image or Video along waves across and down, like VEGAS\' Wave';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.vegas_wave.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWaveVegas.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.vegas_wave.name');

  constructor() {
    super({
      options: [
        {name: 'x-speed', description: 'Sideways wave speed in radians a second, 6.28 is one wave (-100..100) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.x_speed'), label: 'xSpeed', type: Number},
        {name: 'x-frequency', description: 'Half waves down it for the sideways wave (-100..100) (Default: 4)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.x_frequency'), label: 'xFrequency', type: Number},
        {name: 'x-intensity', description: 'How far it moves sideways, of the width (-1..1) (Default: 0.05)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.x_intensity'), label: 'xIntensity', type: Number},
        {name: 'x-phase', description: 'Where the sideways wave starts, in radians (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.x_phase'), label: 'xPhase', type: Number},
        {name: 'y-speed', description: 'Up and down wave speed in radians a second (-100..100) (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.y_speed'), label: 'ySpeed', type: Number},
        {name: 'y-frequency', description: 'Half waves across it for the up and down wave (-100..100) (Default: 4)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.y_frequency'), label: 'yFrequency', type: Number},
        {name: 'y-intensity', description: 'How far it moves up and down, of the height (-1..1) (Default: 0.05)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.y_intensity'), label: 'yIntensity', type: Number},
        {name: 'y-phase', description: 'Where the up and down wave starts, in radians (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_5.fun.vegas_wave.y_phase'), label: 'yPhase', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWaveVegas.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWaveVegas.createMessage(context, args);
  }
}
