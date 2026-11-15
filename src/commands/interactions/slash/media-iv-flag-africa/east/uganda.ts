import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'uganda';

export class MediaIVFlagUgandaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Ugandan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.uganda.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUganda.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.uganda.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUganda.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUganda.createMessage(context, args);
  }
}
