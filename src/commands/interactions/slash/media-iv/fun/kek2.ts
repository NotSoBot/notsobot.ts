import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kek2';

export class MediaIVKek2Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Exo-alienify, Swirl, and Rain an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.kek2.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationKekRain.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationKekRain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationKekRain.createMessage(context, args);
  }
}
