import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'boost-bass';

export class MediaAVAudioBoostBassCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Boost an Audio or Video\'s bass';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.boost_bass.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioBoostBass.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.boost_bass.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioBoostBass.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioBoostBass.createMessage(context, args);
  }
}
