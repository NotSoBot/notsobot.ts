import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mount-rushmore';

export class MediaIVMountRushmoreCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Carve an Image or Video\'s face into Mount Rushmore';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.mount_rushmore.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMountRushmore.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.mount_rushmore.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMountRushmore.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMountRushmore.createMessage(context, args);
  }
}
