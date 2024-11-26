import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'framecount';

export class MediaIVToolsSetFrameCountCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set an Animated Image or Video\'s Frame Count';
  metadata = {
    id: Formatter.Commands.MediaIVToolsSetFrameCount.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'count',
          description: 'Frame Amount',
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsSetFrameCount.CommandArgs) {
    return Formatter.Commands.MediaIVToolsSetFrameCount.createMessage(context, args);
  }
}
