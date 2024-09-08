import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'put-mix';

export class MediaAIVAudioPutMixCommand extends BaseInteractionMediasCommandOption {
  description = 'Mix an Audio/Image/Video\'s audio with another audio file';
  metadata = {
    id: Formatter.Commands.MediaAToolsPutMix.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'longest', description: 'Use the longest media\'s timestamp', type: Boolean},
        {name: 'noloop', description: 'Do not loop the media to match the timestamp', type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAToolsPutMix.CommandArgs) {
    return Formatter.Commands.MediaAToolsPutMix.createMessage(context, args);
  }
}
