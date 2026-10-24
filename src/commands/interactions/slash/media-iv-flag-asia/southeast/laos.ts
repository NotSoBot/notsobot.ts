import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'laos';

export class MediaIVFlagLaosCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Lao flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.laos.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLaos.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.laos.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLaos.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLaos.createMessage(context, args);
  }
}
