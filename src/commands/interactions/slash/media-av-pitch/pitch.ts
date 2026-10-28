import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pitch';

export class MediaAVAudioPitchCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Change an Audio or Video\'s pitch';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.pitch.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioPitch.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.pitch.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Pitch Scale (Default: 2.0)', ...I18n.optionLocalizations('commands.media_av.audio.pitch.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioPitch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPitch.createMessage(context, args);
  }
}
