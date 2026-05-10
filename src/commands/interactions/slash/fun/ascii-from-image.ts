import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ascii-from-image';

export class AsciiFromImageCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image to ASCII Text';
  metadata = {
    id: Formatter.Commands.FunAsciiFromImage.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'mobile', description: 'Adjust Size for Mobile Devices', type: Boolean},
        {
          name: 'size',
          description: 'Ascii Size (1..15) (Default: 15)',
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAsciiFromImage.CommandArgs) {
    return Formatter.Commands.FunAsciiFromImage.createMessage(context, args);
  }
}
