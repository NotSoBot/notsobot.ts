import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'fps';

export class MediaIVToolsSetFPSCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Set an Animated Image or Video\'s FPS';
  metadata = {
    id: Formatter.Commands.MediaIVToolsSetFPS.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'fps',
          description: 'Frames Per Second',
          required: true,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsSetFPS.CommandArgs) {
    return Formatter.Commands.MediaIVToolsSetFPS.createMessage(context, args);
  }
}
