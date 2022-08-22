import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class ImageToolsConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image';
  metadata = {
    id: Formatter.Commands.ImageToolsConvert.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'to', description: 'Image Type'},
        {name: 'size', description: 'number or (width)x(height)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageToolsConvert.CommandArgs) {
    return Formatter.Commands.ImageToolsConvert.createMessage(context, args);
  }
}
