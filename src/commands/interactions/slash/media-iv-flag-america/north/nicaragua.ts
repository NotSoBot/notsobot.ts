import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'nicaragua';

export class MediaIVFlagNicaraguaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Nicaraguan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.nicaragua.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNicaragua.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.nicaragua.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNicaragua.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNicaragua.createMessage(context, args);
  }
}
