import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'channels-combine';

export class MediaAVAudioChannelsCombineCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Combine an Audio or Video file\'s audio streams to be mono';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.channels_combine.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioChannelsCombine.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.channels_combine.name');

  async run(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.MediaAVManipulationAudioChannelsCombine.CommandArgs,
  ) {
    return Formatter.Commands.MediaAVManipulationAudioChannelsCombine.createMessage(context, args);
  }
}
