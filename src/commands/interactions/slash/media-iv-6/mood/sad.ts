import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sad';

export class MediaIVSadCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make the faces in an Image or Video look sad';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.mood.sad.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMoodSad.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.sad.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMoodSad.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMoodSad.createMessage(context, args);
  }
}
