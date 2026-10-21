import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'trinidad';

export class MediaIVFlagTrinidadCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Trinidad and Tobago flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.trinidad.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTrinidad.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.trinidad.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTrinidad.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTrinidad.createMessage(context, args);
  }
}
