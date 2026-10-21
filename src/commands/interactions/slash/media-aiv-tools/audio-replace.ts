import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'audio-replace';

export class MediaAIVAudioPutReplaceCommand extends BaseInteractionMediasCommandOption {
  description = 'Replace an Audio/Image/Video\'s audio with another audio file';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.audio.put_replace.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationAudioPutReplace.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'longest', description: 'Use the longest media\'s timestamp', ...I18n.optionLocalizations('commands.media_aiv_tools.audio.put_replace.longest'), type: Boolean},
        {name: 'noloop', description: 'Do not loop the media to match the timestamp', ...I18n.optionLocalizations('commands.media_aiv_tools.audio.put_replace.noloop'), type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationAudioPutReplace.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAudioPutReplace.createMessage(context, args);
  }
}
