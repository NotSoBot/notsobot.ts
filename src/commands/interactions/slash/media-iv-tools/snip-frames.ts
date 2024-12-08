import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'snip-frames';

export class MediaIVToolsSnipFramesCommand extends BaseInteractionMediaCommandOption {
  description = 'Snip the frames of an Animated Image/Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsSnipFrames.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'start', description: 'Frames to start at', default: 0, type: Number},
        {name: 'end', description: 'Frames to end at', default: 0, type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsSnipFrames.CommandArgs) {
    return Formatter.Commands.MediaIVToolsSnipFrames.createMessage(context, args);
  }
}
