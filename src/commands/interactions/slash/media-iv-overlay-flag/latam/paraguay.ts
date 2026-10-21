import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'paraguay';

export class MediaIVFlagParaguayCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Paraguayan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.paraguay.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagParaguay.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.paraguay.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagParaguay.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagParaguay.createMessage(context, args);
  }
}
