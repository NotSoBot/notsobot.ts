import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'latte';

export class MediaILatteCommand extends BaseInteractionImageCommandOption {
  description = 'Draw an Image on a Latte';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.latte.description');
  metadata = {
    id: Formatter.Commands.MediaIManipulationLatte.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationLatte.CommandArgs) {
    return Formatter.Commands.MediaIManipulationLatte.createMessage(context, args);
  }
}
