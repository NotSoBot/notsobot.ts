import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'canada';

export class MediaIVFlagCanadaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Canadian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.canada.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCanada.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.canada.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCanada.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCanada.createMessage(context, args);
  }
}
