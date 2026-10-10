import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'watermark';

export class MediaIVToolsWatermarkCommand extends BaseInteractionMediasCommandOption {
  description = 'Place the second media small in the bottom right corner of the first media';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayWatermark.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'margin', description: 'Margin as a percentage of the first media (0..50) (Default: 2)', maxValue: 50, minValue: 0, type: Number},
        {name: 'opacity', description: 'Opacity of the watermark (0..100) (Default: 50)', maxValue: 100, minValue: 0, type: Number},
        {name: 'size', description: 'Size as a percentage of the first media (1..100) (Default: 20)', maxValue: 100, minValue: 1, type: Number},
      ],
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayWatermark.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWatermark.createMessage(context, args);
  }
}
