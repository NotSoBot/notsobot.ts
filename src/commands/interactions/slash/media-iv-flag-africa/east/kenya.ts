import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kenya';

export class MediaIVFlagKenyaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Kenyan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.kenya.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagKenya.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.kenya.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagKenya.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKenya.createMessage(context, args);
  }
}
