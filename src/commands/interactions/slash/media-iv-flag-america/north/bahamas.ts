import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bahamas';

export class MediaIVFlagBahamasCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bahamian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bahamas.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBahamas.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bahamas.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBahamas.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBahamas.createMessage(context, args);
  }
}
