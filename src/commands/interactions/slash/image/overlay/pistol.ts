import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pistol';

export class ImageOverlayPistolCommand extends BaseInteractionImageCommandOption {
  description = 'Overlay a pistol on an image';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageOverlayPistol.CommandArgs) {
    return Formatter.Commands.ImageOverlayPistol.createMessage(context, args);
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}
