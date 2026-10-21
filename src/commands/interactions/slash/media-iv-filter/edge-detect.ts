import { Interaction } from 'detritus-client';

import { MediaEdgeDetectMethods } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'edge-detect';

export class MediaIVEdgeDetectCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Extract and compose Image/Video edges using 8-directional Sobel edge detection';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.edge_detect.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEdgeDetect.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.edge_detect.name');

  constructor() {
    super({
      options: [
        {name: 'invert', description: 'Invert Edges', ...I18n.optionLocalizations('commands.media_iv_3.fun.edge_detect.invert'), type: Boolean},
        {
          name: 'method',
          description: 'Compose Method',
          ...I18n.optionLocalizations('commands.media_iv_3.fun.edge_detect.method'),
          choices: Parameters.Slash.oneOf({choices: MediaEdgeDetectMethods, defaultChoice: MediaEdgeDetectMethods.OVER}),
        },
        {name: 'strength', description: 'Contrast Strength (0..50) (Default: 5.0)', ...I18n.optionLocalizations('commands.media_iv_3.fun.edge_detect.strength'), type: 'number'},
        {name: 'mix', description: 'Mixing Percentage (0..100) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_3.fun.edge_detect.mix'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEdgeDetect.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdgeDetect.createMessage(context, args);
  }
}
