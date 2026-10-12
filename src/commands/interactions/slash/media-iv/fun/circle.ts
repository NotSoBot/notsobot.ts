import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'circle';

export class MediaIVCircleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put a Radial Blur on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.circle.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCircle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.fun.circle.name');

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Blur Scale (Default: 8)', ...I18n.optionLocalizations('commands.media_iv.fun.circle.scale'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCircle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCircle.createMessage(context, args);
  }
}
