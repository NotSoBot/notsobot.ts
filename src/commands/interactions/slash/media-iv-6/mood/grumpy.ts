import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grumpy';

export class MediaIVGrumpyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make the faces in an Image or Video scowl grumpily';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.mood.grumpy.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMoodGrumpy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.grumpy.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMoodGrumpy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMoodGrumpy.createMessage(context, args);
  }
}
