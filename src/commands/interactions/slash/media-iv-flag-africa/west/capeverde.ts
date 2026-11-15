import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'capeverde';

export class MediaIVFlagCapeVerdeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Cape Verdean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.capeverde.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCapeVerde.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.capeverde.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCapeVerde.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCapeVerde.createMessage(context, args);
  }
}
