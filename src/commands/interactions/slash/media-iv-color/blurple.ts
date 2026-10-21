import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'blurple';

export class MediaIVBlurpleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Blurple-fy an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.blurple.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBlurple.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBlurple.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBlurple.createMessage(context, args);
  }
}
