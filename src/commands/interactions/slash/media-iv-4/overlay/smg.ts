import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'smg';

export class MediaIVOverlaySMGCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'This command is disabled while we wait for Discord Compliance approval.';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.awaiting_compliance');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayHalfLifeSMG.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.smg.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayHalfLifeSMG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHalfLifeSMG.createMessage(context, args);
  }
}
