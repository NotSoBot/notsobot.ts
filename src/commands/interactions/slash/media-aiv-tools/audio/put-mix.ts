import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'put-mix';

export class MediaAIVAudioPutMixCommand extends BaseInteractionMediasCommandOption {
  description = 'Mix an Audio/Image/Video\'s audio with another audio file';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.audio.put_mix.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationAudioPutMix.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'longest', description: 'Use the longest media\'s timestamp', ...I18n.optionLocalizations('commands.media_aiv_tools.audio.put_mix.longest'), type: Boolean},
        {name: 'noloop', description: 'Do not loop the media to match the timestamp', ...I18n.optionLocalizations('commands.media_aiv_tools.audio.put_mix.noloop'), type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationAudioPutMix.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAudioPutMix.createMessage(context, args);
  }
}
