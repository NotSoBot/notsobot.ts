import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'derain';

export class MediaIVDerainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Scramble an Image or Video\'s colors by reading them as HSB (the reverse of rain)';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.derain.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDerain.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDerain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDerain.createMessage(context, args);
  }
}
