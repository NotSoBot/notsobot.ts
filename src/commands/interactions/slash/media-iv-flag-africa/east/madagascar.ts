import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'madagascar';

export class MediaIVFlagMadagascarCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Malagasy flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.madagascar.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMadagascar.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.madagascar.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMadagascar.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMadagascar.createMessage(context, args);
  }
}
