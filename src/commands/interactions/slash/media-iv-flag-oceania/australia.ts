import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'australia';

export class MediaIVFlagAustraliaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Australian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.australia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAustralia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.australia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAustralia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAustralia.createMessage(context, args);
  }
}
