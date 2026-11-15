import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'centralafricanrepublic';

export class MediaIVFlagCentralAfricanRepublicCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Central African Republic flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.centralafricanrepublic.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCentralAfricanRepublic.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.centralafricanrepublic.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCentralAfricanRepublic.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCentralAfricanRepublic.createMessage(context, args);
  }
}
