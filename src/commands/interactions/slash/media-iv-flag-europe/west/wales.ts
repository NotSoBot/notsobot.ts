import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wales';

export class MediaIVFlagWalesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Welsh flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.wales.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagWales.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.wales.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagWales.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagWales.createMessage(context, args);
  }
}
