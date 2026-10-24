import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kyrgyzstan';

export class MediaIVFlagKyrgyzstanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Kyrgyz flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.kyrgyzstan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagKyrgyzstan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.kyrgyzstan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagKyrgyzstan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKyrgyzstan.createMessage(context, args);
  }
}
