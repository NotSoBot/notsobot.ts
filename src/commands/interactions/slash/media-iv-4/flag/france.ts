import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'france';

export class MediaIVFlagFranceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a French flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.france.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagFrance.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.france.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagFrance.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagFrance.createMessage(context, args);
  }
}
