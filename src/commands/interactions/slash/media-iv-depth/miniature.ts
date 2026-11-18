import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';
import { FOCUS_OPTIONS } from './options';


export const COMMAND_NAME = 'miniature';

export class MediaIVDepthMiniatureCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Tilt-shift: make it look like a tiny model, blurred by depth with stronger colors';
  descriptionLocalizations = I18n.localizations('commands.media_iv_depth.miniature.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDepthMiniature.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_depth.miniature.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: 'How much blur, 0.1 to 10 (Default: 2.5)',
          ...I18n.optionLocalizations('commands.media_iv_depth.miniature.amount'),
          maxValue: 10,
          minValue: 0.1,
          type: 'number',
        },
        ...FOCUS_OPTIONS,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDepthMiniature.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthMiniature.createMessage(context, args);
  }
}
