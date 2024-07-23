import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'trim';

export class ImageToolsTrimCommand extends BaseInteractionImageCommandOption {
  description = 'Trim an Image\'s Excess Background';
  metadata = {
    id: Formatter.Commands.MediaIVToolsTrim.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'margin', description: 'Trim Margins (Default: 16px)', type: ApplicationCommandOptionTypes.NUMBER},
        {name: 'threshold', description: 'Color Threshold (Default: 10)', type: ApplicationCommandOptionTypes.NUMBER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsTrim.CommandArgs) {
    return Formatter.Commands.MediaIVToolsTrim.createMessage(context, args);
  }
}
