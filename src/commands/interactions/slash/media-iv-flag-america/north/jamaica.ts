import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'jamaica';

export class MediaIVFlagJamaicaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Jamaican flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.jamaica.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagJamaica.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.jamaica.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagJamaica.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagJamaica.createMessage(context, args);
  }
}
