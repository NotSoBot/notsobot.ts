import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'thailand';

export class MediaIVFlagThailandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Thai flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.thailand.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagThailand.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.thailand.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagThailand.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagThailand.createMessage(context, args);
  }
}
