import { Interaction } from 'detritus-client';

import { MediaCartoonMethods, MediaCartoonMethodsToText } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cartoon';

export class MediaIVCartoonCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Cartoon Effect on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCartoon.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Amount (0..10) (Default: 4.0)', type: 'number'},
        {name: 'brightness', description: 'Brightness (0..100) (Default: 100)', type: Number},
        {
          name: 'method',
          description: 'Edge Method',
          choices: Parameters.Slash.oneOf({
            choices: MediaCartoonMethods,
            defaultChoice: MediaCartoonMethods.COLOR_DODGE_BLUR,
            descriptions: MediaCartoonMethodsToText,
          }),
        },
        {name: 'levels', description: 'Levels (2..10) (Default: 6)', type: Number},
        {name: 'pattern', description: 'Pattern (0..100) (Default: 70)', type: Number},
        {name: 'strength', description: 'Saturation (0..300) (Default: 150)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCartoon.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCartoon.createMessage(context, args);
  }
}
