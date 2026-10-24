import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'taiwan';

export class MediaIVFlagTaiwanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Taiwanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.taiwan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTaiwan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.taiwan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTaiwan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTaiwan.createMessage(context, args);
  }
}
