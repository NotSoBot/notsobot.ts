import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'offset';

export class MediaIVToolsOffsetCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Offset an Image or Video by X or Y amount';
  metadata = {
    id: Formatter.Commands.MediaIVToolsOffset.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'x', description: 'X Offset'},
        {name: 'y', description: 'Y Offset'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsOffset.CommandArgs) {
    return Formatter.Commands.MediaIVToolsOffset.createMessage(context, args);
  }
}
