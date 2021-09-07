import { Interaction } from 'detritus-client';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ImageOverlayPistolCommand extends BaseInteractionCommandOption {
  description = 'Overlay a pistol on an image';
  name = 'pistol';

  async run(context: Interaction.InteractionContext) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}
