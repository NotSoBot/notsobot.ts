import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'phosimp';

export class MediaIVPhoSimpCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply PhoSimp Filters on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPhoSimp.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'filters', description: 'PhoSimp Filters, separated with space', value: Parameters.phosimpFilters},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPhoSimp.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPhoSimp.createMessage(context, args);
  }
}
