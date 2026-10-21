import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'finland';

export class MediaIVFlagFinlandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Finnish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.finland.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagFinland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.finland.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagFinland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagFinland.createMessage(context, args);
  }
}
