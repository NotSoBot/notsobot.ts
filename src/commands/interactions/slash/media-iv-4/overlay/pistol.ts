import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pistol';

export class MediaIVOverlayPistolCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'This command is disabled while we wait for Discord Compliance approval.';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.awaiting_compliance');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.pistol.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifePistol.createMessage(context, args);
  }
}
