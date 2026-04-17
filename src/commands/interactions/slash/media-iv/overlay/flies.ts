import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flies';

export class MediaIVOverlayFliesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay some flies on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlies.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Amount of Flies (1..100) (Default: 1)', type: Number},
        {name: 'degrees', description: 'Custom Fly Starting Angle (-360..360)', type: Number},
        {
          name: 'fly',
          description: 'Custom Fly Emoji/Media URL/User',
          label: 'flyImage',
          value: Parameters.mediaUrl({audio: false, video: false, onlyContent: true}),
        },
        {name: 'speed', description: 'Fly Speed (0.01..1000.0) (Default: 10.0)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlies.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlies.createMessage(context, args);
  }
}
