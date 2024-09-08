import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'face';

export class MediaIVOverlayFaceCommand extends BaseInteractionMediasCommandOption {
  description = 'Overlay Media onto the face of another Media';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFace.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Overlay Media\'s Scale relative to the face (default: 1.35)', type: Boolean},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFace.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFace.createMessage(context, args);
  }
}
