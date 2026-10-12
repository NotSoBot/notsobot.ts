import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'magik';

export class MediaIVMagikCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Magikfy an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.magik.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMagik.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMagik.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagik.createMessage(context, args);
  }
}
