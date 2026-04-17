import { Interaction } from 'detritus-client';

import { MediaResizeKernels } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'resize';

export class MediaIVToolsResizeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Resize an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsResize.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Resize Scale (Default: 2.0)', default: 2, type: 'number'},
        {
          name: 'kernel',
          description: 'Resampling filter used for scaling',
          choices: Parameters.Slash.oneOf({choices: MediaResizeKernels}),
        },
        {name: 'ratio', description: 'Keep the Image\'s Ratio the same', type: Boolean},
        {name: 'size', description: 'number or (width)x(height)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsResize.CommandArgs) {
    return Formatter.Commands.MediaIVToolsResize.createMessage(context, args);
  }
}
