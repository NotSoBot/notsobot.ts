import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'liberia';

export class MediaIVFlagLiberiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Liberian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.liberia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLiberia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.liberia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLiberia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLiberia.createMessage(context, args);
  }
}
