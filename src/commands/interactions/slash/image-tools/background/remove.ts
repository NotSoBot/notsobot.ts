import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ImageBackgroundRemoveCommand extends BaseInteractionImageCommandOption {
  description = 'Remove an image\'s background';
  metadata = {
    id: Formatter.Commands.MediaIVToolsBackgroundRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'Background Removal Model',
          choices: Formatter.Commands.MediaIVToolsBackgroundRemove.SLASH_CHOICES_MODEL,
          default: Formatter.Commands.MediaIVToolsBackgroundRemove.DEFAULT_MODEL,
        },
        {
          name: 'trim',
          description: 'Trim Excess Background',
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsBackgroundRemove.CommandArgs) {
    return Formatter.Commands.MediaIVToolsBackgroundRemove.createMessage(context, args);
  }
}
