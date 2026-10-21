import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'brazil';

export class MediaIVFlagBrazilCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Brazilian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.brazil.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBrazil.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.brazil.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBrazil.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBrazil.createMessage(context, args);
  }
}
