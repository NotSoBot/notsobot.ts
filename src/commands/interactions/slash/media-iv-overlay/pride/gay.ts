import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gay';

export class MediaIVOverlayGayCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an LGBT pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.gay.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLGBT.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.gay.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLGBT.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLGBT.createMessage(context, args);
  }
}
