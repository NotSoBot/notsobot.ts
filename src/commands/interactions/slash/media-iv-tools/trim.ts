import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'trim';

export class MediaIVToolsTrimCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Trim an Image or Video\'s Excess Background';
  metadata = {
    id: Formatter.Commands.MediaIVToolsTrim.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'margin', description: 'Trim Margins (Default: 16px)', type: Number},
        {name: 'threshold', description: 'Color Threshold (Default: 10)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsTrim.CommandArgs) {
    return Formatter.Commands.MediaIVToolsTrim.createMessage(context, args);
  }
}
