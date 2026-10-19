import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'surprised';

export class MediaIVSurprisedCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make the faces in an Image or Video look surprised';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.mood.surprised.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMoodSurprised.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.surprised.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMoodSurprised.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMoodSurprised.createMessage(context, args);
  }
}
