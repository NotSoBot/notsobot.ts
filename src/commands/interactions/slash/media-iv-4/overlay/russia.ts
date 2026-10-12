import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'russia';

export class MediaIVOverlayRussiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Russian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.russia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagRussia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.russia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagRussia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagRussia.createMessage(context, args);
  }
}
