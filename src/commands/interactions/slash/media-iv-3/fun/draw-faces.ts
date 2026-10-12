import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'draw-faces';

export class MediaIVDrawFacesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Draw numbered ovals over every detected face in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.draw_faces.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDrawFaces.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.draw_faces.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDrawFaces.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDrawFaces.createMessage(context, args);
  }
}
