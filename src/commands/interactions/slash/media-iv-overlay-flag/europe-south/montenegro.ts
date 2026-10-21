import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'montenegro';

export class MediaIVFlagMontenegroCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Montenegrin flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.montenegro.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMontenegro.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.montenegro.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMontenegro.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMontenegro.createMessage(context, args);
  }
}
