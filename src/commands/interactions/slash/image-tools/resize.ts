import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'resize';

export class ImageToolsResizeCommand extends BaseInteractionImageCommandOption {
  description = 'Resize an Image';
  metadata = {
    id: Formatter.Commands.MediaIVToolsResize.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Resize Scale (Default: 2)', default: 2, type: Number},
        {name: 'convert', description: 'Image Type'},
        {name: 'ratio', description: 'Keep the Image\'s Ratio the same', type: Boolean},
        {name: 'size', description: 'number or (width)x(height)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsResize.CommandArgs) {
    return Formatter.Commands.MediaIVToolsResize.createMessage(context, args);
  }
}
