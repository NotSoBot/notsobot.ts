import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'vocoder';

export class MediaAVAudioVocoderCommand extends BaseInteractionMediasCommandOption {
  description = 'Make the voice in the first Audio or Video sing the second one\'s music';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.vocoder.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioVocoder.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.vocoder.name');

  constructor() {
    super({
      options: [
        {name: 'bands', description: 'Frequency bands, fewer sounds more robotic, 1 to 512 (Default: 75)', ...I18n.optionLocalizations('commands.media_av.audio.vocoder.bands'), type: Number},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVocoder.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVocoder.createMessage(context, args);
  }
}
