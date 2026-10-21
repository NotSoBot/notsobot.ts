import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'wave';

export class MediaIVWaveCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Distort an Image or Video with a sine wave function';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.wave.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWave.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.wave.name');

  constructor() {
    super({
      options: [
        {name: 'amplitude', description: 'Amplitude Amount (Pixels that will be displaced Up or Down) (Default: 10)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wave.amplitude'), type: Number},
        {name: 'length', description: 'Wave Length of the sine function (Default: 64)', ...I18n.optionLocalizations('commands.media_iv_2.fun.wave.length'), label: 'waveLength', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWave.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWave.createMessage(context, args);
  }
}
