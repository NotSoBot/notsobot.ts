import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flies';

export class MediaIVManipulationOverlayFliesCommand extends BaseInteractionImageCommandOption {
  description = 'Overlay some flies on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlies.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Amount of Flies', type: Number},
        {name: 'degrees', description: 'Custom Fly Starting Angle', type: Number},
        {name: 'fly', description: 'Custom Fly Image', label: 'flyImage', value: Parameters.mediaUrl({audio: false, video: false, onlyContent: true})},
        {name: 'speed', description: 'Fly Speed', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlies.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlies.createMessage(context, args);
  }
}
