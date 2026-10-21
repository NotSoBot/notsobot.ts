import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'moldova';

export class MediaIVFlagMoldovaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Moldovan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.moldova.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMoldova.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.moldova.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMoldova.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMoldova.createMessage(context, args);
  }
}
