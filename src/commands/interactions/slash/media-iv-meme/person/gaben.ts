import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gaben';

export class MediaIVOverlayGabenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video over a sign held by Gabe Newell';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.gaben.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsGaben1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.gaben.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsGaben1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsGaben1.createMessage(context, args);
  }
}
