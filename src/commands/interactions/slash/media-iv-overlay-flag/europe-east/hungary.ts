import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hungary';

export class MediaIVFlagHungaryCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Hungarian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.hungary.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagHungary.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.hungary.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagHungary.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagHungary.createMessage(context, args);
  }
}
