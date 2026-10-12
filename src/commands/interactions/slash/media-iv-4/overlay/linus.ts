import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'linus';

export class MediaIVOverlayLinusCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video over a monitor with Linus Tech Tips';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.linus.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsLTTLinus1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.linus.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsLTTLinus1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsLTTLinus1.createMessage(context, args);
  }
}
