import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'honduras';

export class MediaIVFlagHondurasCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Honduran flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.honduras.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagHonduras.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.honduras.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagHonduras.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagHonduras.createMessage(context, args);
  }
}
