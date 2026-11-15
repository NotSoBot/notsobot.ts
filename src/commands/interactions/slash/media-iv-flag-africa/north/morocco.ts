import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'morocco';

export class MediaIVFlagMoroccoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Moroccan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.morocco.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMorocco.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.morocco.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMorocco.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMorocco.createMessage(context, args);
  }
}
