import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cuba';

export class MediaIVFlagCubaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Cuban flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.cuba.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCuba.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.cuba.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCuba.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCuba.createMessage(context, args);
  }
}
