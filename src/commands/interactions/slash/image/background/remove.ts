import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ImageBackgroundRemoveCommand extends BaseInteractionImageCommandOption {
  description = 'Remove an image\'s background';
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
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageBackgroundRemove.CommandArgs) {
    return Formatter.Commands.ImageBackgroundRemove.createMessage(context, args);
  }
}
