import { Interaction } from 'detritus-client';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ImageInvertCommand extends BaseInteractionCommandOption {
  description = 'Invert an image';
  name = 'invert';

  async run(context: Interaction.InteractionContext) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}
