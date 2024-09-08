import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'overlay';

export class MediaAIVToolsOverlayCommand extends BaseInteractionMediasCommandOption {
  description = 'Overlay one media on top of another';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsOverlay.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'blend', description: 'Similarity Blend Amount'},
        {name: 'color', description: 'Color to make transparent'},
        {name: 'noloop', description: 'Do not loop the shortest media to match the longest media timestamp', type: Boolean},
        {name: 'opacity', description: 'Opacity of the overlay', type: Number},
        {name: 'resize', description: 'Resize Equation (ex: "fit(mw, mh)")'},
        {name: 'similarity', description: 'Color similarity percentage to make transparent'},
        {name: 'x', description: 'X Position Equation (ex: "(mw/2)-(ow/2)")'},
        {name: 'y', description: 'Y Position Equation (ex: "(mh/2)-(oh/2)")'},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsOverlay.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsOverlay.createMessage(context, args);
  }
}
