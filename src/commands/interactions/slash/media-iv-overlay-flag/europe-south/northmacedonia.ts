import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'northmacedonia';

export class MediaIVFlagNorthMacedoniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a North Macedonian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.northmacedonia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNorthMacedonia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.northmacedonia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNorthMacedonia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNorthMacedonia.createMessage(context, args);
  }
}
