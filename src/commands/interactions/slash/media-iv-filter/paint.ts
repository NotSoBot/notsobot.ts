import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'paint';

export class MediaIVPaintCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply an Oil Paint effect to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.paint.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPaint.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.paint.name');

  constructor() {
    super({
      options: [
        {name: 'radius', description: 'Paint Blob Radius (Default: 3)', ...I18n.optionLocalizations('commands.media_iv_2.fun.paint.radius'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPaint.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaint.createMessage(context, args);
  }
}
