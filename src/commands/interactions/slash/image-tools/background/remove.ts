import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ImageBackgroundRemoveCommand extends BaseInteractionImageCommandOption {
  description = 'Remove an image\'s background';
  metadata = {
    id: Formatter.Commands.ImageBackgroundRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'Background Removal Model',
          choices: Formatter.Commands.ImageBackgroundRemove.SLASH_CHOICES_MODEL,
          default: Formatter.Commands.ImageBackgroundRemove.DEFAULT_MODEL,
        },
        {
          name: 'trim',
          description: 'Trim Excess Background',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageBackgroundRemove.CommandArgs) {
    return Formatter.Commands.ImageBackgroundRemove.createMessage(context, args);
  }
}
