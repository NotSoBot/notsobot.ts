import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'audio';

export class MediaAVExtractAudioCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Extract Audio from an Audio or Video File';
  descriptionLocalizations = I18n.localizations('commands.media_av.extract.audio.description');
  metadata = {
    id: Formatter.Commands.MediaAVToolsExtractAudio.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsExtractAudio.CommandArgs) {
    return Formatter.Commands.MediaAVToolsExtractAudio.createMessage(context, args);
  }
}
