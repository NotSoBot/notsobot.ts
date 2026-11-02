import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'distortion';

export class MediaAVAudioDistortionCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Distort an Audio or Video\'s audio, pushing it into clipping';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.distortion.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioDistortion.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.distortion.name');

  constructor() {
    super({
      options: [
        {name: 'drive', description: 'How hard the audio is pushed, 0 to 100 (Default: 50)', ...I18n.optionLocalizations('commands.media_av.audio.distortion.drive'), type: 'number'},
        {name: 'mix', description: 'How much of the distorted audio to use, 0 to 1 (Default: 1)', ...I18n.optionLocalizations('commands.media_av.audio.distortion.mix'), type: 'number'},
        {name: 'lowpass', description: 'Cut the sound above this many Hz, 0 for off (Default: 0)', ...I18n.optionLocalizations('commands.media_av.audio.distortion.lowpass'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioDistortion.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDistortion.createMessage(context, args);
  }
}
