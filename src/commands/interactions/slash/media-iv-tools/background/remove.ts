import { Interaction } from 'detritus-client';

import { ImageBackgroundRemovalModels } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class MediaIVToolsBackgroundRemoveCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Remove an Image or Video\'s background';
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
          choices: Parameters.Slash.oneOf({
            choices: ImageBackgroundRemovalModels,
            defaultChoice: Formatter.Commands.MediaIVToolsBackgroundRemove.DEFAULT_MODEL,
          }),
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
