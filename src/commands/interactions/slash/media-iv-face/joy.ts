import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'joy';

export class MediaIVJoyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put a 😂 over every face in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.joy.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceJoy.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.joy.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceJoy.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceJoy.createMessage(context, args);
  }
}
