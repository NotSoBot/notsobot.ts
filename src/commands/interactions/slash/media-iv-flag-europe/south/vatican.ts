import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'vatican';

export class MediaIVFlagVaticanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Vatican City flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.vatican.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagVatican.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.vatican.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagVatican.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagVatican.createMessage(context, args);
  }
}
