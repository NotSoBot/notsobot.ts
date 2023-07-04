import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class ImageObjectRemoveCommand extends BaseInteractionImageCommandOption {
  description = 'Remove object(s) from an image';
  metadata = {
    id: Formatter.Commands.MediaIVToolsObjectRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'object',
          description: 'Name of the object to remove',
          onAutoComplete: Parameters.AutoComplete.objectRemovalLabels,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsObjectRemove.CommandArgs) {
    return Formatter.Commands.MediaIVToolsObjectRemove.createMessage(context, args);
  }
}
