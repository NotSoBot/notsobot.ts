import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'angry';

export class MediaIVAngryCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make the faces in an Image or Video snarl angrily';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.mood.angry.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMoodAngry.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.angry.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMoodAngry.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMoodAngry.createMessage(context, args);
  }
}
