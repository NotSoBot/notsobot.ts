import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'austria';

export class MediaIVFlagAustriaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Austrian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.austria.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAustria.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.austria.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAustria.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAustria.createMessage(context, args);
  }
}
