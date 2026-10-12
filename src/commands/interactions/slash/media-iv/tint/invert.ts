import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'invert';

export class MediaIVInvertCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Invert an Image or Video\'s Color';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.invert.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInvert.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.invert.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInvert.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvert.createMessage(context, args);
  }
}
