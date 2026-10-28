import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'destroy';

export class MediaAVAudioDestroyCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Destroy an Audio or Video\'s audio with heavy bit crushing';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.destroy.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioDestroy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.destroy.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioDestroy.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDestroy.createMessage(context, args);
  }
}
