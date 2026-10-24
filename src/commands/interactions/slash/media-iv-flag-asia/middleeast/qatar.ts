import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'qatar';

export class MediaIVFlagQatarCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Qatari flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.qatar.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagQatar.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.qatar.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagQatar.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagQatar.createMessage(context, args);
  }
}
