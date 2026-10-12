import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'channels-invert';

export class MediaAVAudioChannelsInvertCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Swap the left and right audio channels of an Audio or Video file';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.channels_invert.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioChannelsInvert.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.channels_invert.name');

  async run(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.MediaAVManipulationAudioChannelsInvert.CommandArgs,
  ) {
    return Formatter.Commands.MediaAVManipulationAudioChannelsInvert.createMessage(context, args);
  }
}
