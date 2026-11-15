import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'benin';

export class MediaIVFlagBeninCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Beninese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.benin.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBenin.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.benin.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBenin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBenin.createMessage(context, args);
  }
}
