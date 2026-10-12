import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kek';

export class MediaIVKekCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Exo-alienify and Swirl an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.kek.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationKek.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationKek.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationKek.createMessage(context, args);
  }
}
