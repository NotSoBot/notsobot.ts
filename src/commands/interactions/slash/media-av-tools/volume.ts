import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'volume';

export class MediaAVAudioVolumeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Manipulate an Audio or Video\'s Volume';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.volume.description');
  metadata = {
  id: Formatter.Commands.MediaAVManipulationAudioVolume.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.volume.name');

  constructor() {
    super({
      options: [
        {name: 'volume', description: 'Volume Scale (Default: 2.0)', ...I18n.optionLocalizations('commands.media_av.audio.volume.volume'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVolume.CommandArgs) {
  return Formatter.Commands.MediaAVManipulationAudioVolume.createMessage(context, args);
  }
}
