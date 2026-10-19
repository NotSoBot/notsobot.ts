import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'latte';

export class MediaIVLatteCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Draw an Image or Video on a Latte';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.latte.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLatte.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLatte.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLatte.createMessage(context, args);
  }
}
