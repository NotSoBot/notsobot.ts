import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ussr';

export class MediaIVOverlayUSSRCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a USSR flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.ussr.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUSSR.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.ussr.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUSSR.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUSSR.createMessage(context, args);
  }
}
