import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'smug';

export class MediaIVSmugCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make the faces in an Image or Video look smug';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.mood.smug.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceMoodSmug.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.smug.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceMoodSmug.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceMoodSmug.createMessage(context, args);
  }
}
