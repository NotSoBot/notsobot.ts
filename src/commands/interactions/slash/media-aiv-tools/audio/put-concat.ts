import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'put-concat';

export class MediaAIVAudioPutConcatCommand extends BaseInteractionMediasCommandOption {
  description = 'Concat an Audio/Image/Video\'s audio with another audio file';
  metadata = {
    id: Formatter.Commands.MediaAToolsPutConcat.COMMAND_ID,
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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAToolsPutConcat.CommandArgs) {
    return Formatter.Commands.MediaAToolsPutConcat.createMessage(context, args);
  }
}