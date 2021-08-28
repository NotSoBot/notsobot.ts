import { Interaction } from 'detritus-client';

import { BaseCommandOption } from '../basecommand';


export class ImageInvertCommand extends BaseCommandOption {
  description = 'Invert an image';
  name = 'invert';

  async run(context: Interaction.InteractionContext) {
    return context.editOrRespond({content: 'wip', flags: 64});
  }
}
