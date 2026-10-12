import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'waves';

export class MediaIVWavesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Distort an Image or Video with a sine wave function that moves';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.waves.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWaveAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.waves.name');

  constructor() {
    super({
      options: [
        {name: 'amplitude', description: 'Amplitude Amount (Pixels that will be displaced Up or Down) (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_2.fun.waves.amplitude'), type: Number},
        {name: 'length', description: 'Wave Length of the sine function (Default: 64)', ...I18n.optionLocalizations('commands.media_iv_2.fun.waves.length'), label: 'waveLength', type: Number},
        {name: 'speed', description: 'Wave Speed (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_2.fun.waves.speed'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWaveAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWaveAnimated.createMessage(context, args);
  }
}
