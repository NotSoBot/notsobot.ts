import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'notresponding';

export class MediaIVOverlayNotRespondingCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a frozen Windows "Not Responding" window on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.notresponding.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayNotResponding.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.notresponding.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayNotResponding.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayNotResponding.createMessage(context, args);
  }
}
