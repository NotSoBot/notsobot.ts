import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reverse';

export class MediaAVAudioReverseCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Reverse an Audio or Video\'s audio';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.reverse.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.reverse.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioReverse.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioReverse.createMessage(context, args);
  }
}
