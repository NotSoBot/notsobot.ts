import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'datamosh';

export class MediaIVDatamoshCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Datamosh an Animated Image or Video (Duplicates P-frames)';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDatamosh.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'chance', description: 'Chance Percentage (1..100) (Default: 8)', type: Number},
        {name: 'repeat', description: 'Repeat P-frames Amount (1..100) (Default: 20)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDatamosh.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDatamosh.createMessage(context, args);
  }
}
