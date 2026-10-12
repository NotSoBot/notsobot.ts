import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grayscale';

export class MediaIVGrayscaleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Grayscale an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.grayscale.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGrayscale.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.grayscale.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGrayscale.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGrayscale.createMessage(context, args);
  }
}
