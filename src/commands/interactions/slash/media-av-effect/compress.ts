import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'compress';

export class MediaAVAudioCompressCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Compress Audio';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.compress.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioCompress.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.compress.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioCompress.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioCompress.createMessage(context, args);
  }
}
