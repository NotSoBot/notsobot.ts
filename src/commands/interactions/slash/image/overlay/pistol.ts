import { Interaction } from 'detritus-client';

import { BaseCommandOption } from '../../basecommand';


export class ImageOverlayPistolCommand extends BaseCommandOption {
  description = 'Overlay a pistol on an image';
  name = 'pistol';

  async run(context: Interaction.InteractionContext) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}
