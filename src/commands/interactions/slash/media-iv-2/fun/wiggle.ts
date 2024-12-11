import { Interaction } from 'detritus-client';

import { MediaWiggleDirections } from '../../../../../constants';
import { Formatter, Parameters, toTitleCase } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


const DEFAULT_DIRECTION = Formatter.Commands.MediaIVManipulationWiggle.DEFAULT_DIRECTION;

export const COMMAND_NAME = 'wiggle';

export class MediaIVWiggleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Wiggle an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWiggle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Wiggle Distortion Amount (Default: 10)', type: Number},
        {
          name: 'direction',
          description: `Wave Direction (Default: ${toTitleCase(DEFAULT_DIRECTION)})`,
          choices: Parameters.Slash.oneOf({
            choices: MediaWiggleDirections,
            defaultChoice: DEFAULT_DIRECTION,
          }),
        },
        {name: 'wavelengths', description: 'Sinusoidal Wavelengths Amount (Default: 0.5)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWiggle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWiggle.createMessage(context, args);
  }
}
