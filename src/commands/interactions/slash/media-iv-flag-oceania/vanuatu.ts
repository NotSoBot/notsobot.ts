import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'vanuatu';

export class MediaIVFlagVanuatuCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Ni-Vanuatu flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.vanuatu.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagVanuatu.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.vanuatu.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagVanuatu.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagVanuatu.createMessage(context, args);
  }
}
