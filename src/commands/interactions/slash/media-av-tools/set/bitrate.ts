import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bitrate';

export class MediaAVToolsSetBitRateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set an Audio or Video File\'s Bit Rate';
  metadata = {
    id: Formatter.Commands.MediaAVToolsSetBitRate.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'audio',
          description: 'Audio Bit Rate',
          type: Number,
        },
        {
          name: 'video',
          description: 'Video Bit Rate',
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsSetBitRate.CommandArgs) {
    return Formatter.Commands.MediaAVToolsSetBitRate.createMessage(context, args);
  }
}
