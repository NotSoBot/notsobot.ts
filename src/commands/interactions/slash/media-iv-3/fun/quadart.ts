import { Interaction } from 'detritus-client';

import { MediaQuadartTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'quadart';

export class MediaIVQuadartCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Redraw an Image or Video as a quad-tree of circles or boxes';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.quadart.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationQuadart.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.quadart.name');

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Shape to draw with (Default: circle)',
          ...I18n.optionLocalizations('commands.media_iv_3.fun.quadart.type'),
          choices: Parameters.Slash.oneOf({choices: MediaQuadartTypes, defaultChoice: MediaQuadartTypes.CIRCLE}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationQuadart.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationQuadart.createMessage(context, args);
  }
}
