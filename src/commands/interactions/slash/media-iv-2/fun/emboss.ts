import { Interaction } from 'detritus-client';

import { MediaEmbossComposeMethods, MediaEmbossMethods } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'emboss';

export class MediaIVEmbossCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply an Emboss effect to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEmboss.COMMAND_ID,
  };
  name = COMMAND_NAME;
  
  constructor() {
    super({
      options: [
        {
          name: 'method',
          description: 'Emboss Method',
          choices: Parameters.Slash.oneOf({choices: MediaEmbossMethods, defaultChoice: MediaEmbossMethods.GIMP}),
        },
        {name: 'azimuth', description: 'Direction the light is coming from (0..360) (Default: 135)', type: Number},
        {name: 'compose', description: 'Blend Method', choices: Parameters.Slash.oneOf({choices: MediaEmbossComposeMethods})},
        {name: 'elevation', description: 'How high up the light is (0..90) (Default: 45)', type: Number},
        {name: 'depth', description: 'Effect Strength (0..100) (Default: 1)', type: Number},
        {name: 'intensity', description: 'Contrast Strength (-50..50) (Default: 0)', type: Number},
        {name: 'gray', description: 'Brightness Level (0.0..1.0) (Default: 0)', type: 'number'},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEmboss.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEmboss.createMessage(context, args);
  }
}
