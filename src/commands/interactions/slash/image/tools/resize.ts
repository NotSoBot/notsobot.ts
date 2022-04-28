import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'resize';

export class ImageToolsResizeCommand extends BaseInteractionImageCommandOption {
  description = 'Resize an Image';
  metadata = {
    id: Formatter.Commands.ImageToolsResize.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Resize Scale (Default: 2)', default: 2, type: Number},
        {name: 'convert', description: 'Image Type'},
        {name: 'size', description: 'number or (width)x(height)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageToolsResize.CommandArgs) {
    return Formatter.Commands.ImageToolsResize.createMessage(context, args);
  }
}
