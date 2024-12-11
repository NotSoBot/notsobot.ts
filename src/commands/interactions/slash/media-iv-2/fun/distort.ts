import { Interaction } from 'detritus-client';

import { MediaDistortMethods } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'distort';

export class MediaIVDistortCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Use ImageMagick\'s Distort Operation on an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDistort.COMMAND_ID,
  };
  name = COMMAND_NAME;
  
  constructor() {
    super({
      options: [
        {
          name: 'method',
          description: 'ImageMagick Distort Method',
          choices: Object.values(MediaDistortMethods).map((value) => {
            return {name: value, value};
          }),
        },
        {name: 'arguments', description: 'Distort Arguments', value: Parameters.arrayOfFloats},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDistort.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDistort.createMessage(context, args);
  }
}
