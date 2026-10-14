import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'shotgun';

export class MediaIVOverlayShotgunCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'This command is disabled while we wait for Discord Compliance approval.';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.awaiting_compliance');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayHalfLifeShotgun.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.shotgun.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifeShotgun.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifeShotgun.createMessage(context, args);
  }
}
