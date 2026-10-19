import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'lenin';

export class MediaIVLeninCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put the faces in an Image or Video into an old sepia photo';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.lenin.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceLenin.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.lenin.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceLenin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceLenin.createMessage(context, args);
  }
}
