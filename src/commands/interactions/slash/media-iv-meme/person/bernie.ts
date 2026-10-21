import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bernie';

export class MediaIVOverlayBernieCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video over a sign pointed at by Bernie Sanders';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.bernie.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsBernie1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.bernie.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsBernie1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsBernie1.createMessage(context, args);
  }
}
