import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'audio-concat';

export class MediaAIVAudioPutConcatCommand extends BaseInteractionMediasCommandOption {
  description = 'Concat an Audio/Image/Video\'s audio with another audio file';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.audio.put_concat.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationAudioPutConcat.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'longest', description: 'Use the longest media\'s timestamp', ...I18n.optionLocalizations('commands.media_aiv_tools.audio.put_concat.longest'), type: Boolean},
        {name: 'noloop', description: 'Do not loop the media to match the timestamp', ...I18n.optionLocalizations('commands.media_aiv_tools.audio.put_concat.noloop'), type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationAudioPutConcat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAudioPutConcat.createMessage(context, args);
  }
}
