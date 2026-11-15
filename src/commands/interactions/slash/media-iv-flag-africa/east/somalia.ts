import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'somalia';

export class MediaIVFlagSomaliaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Somali flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.somalia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSomalia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.somalia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSomalia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSomalia.createMessage(context, args);
  }
}
