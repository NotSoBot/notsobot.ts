import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'burn';

export class MediaIVBurnCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Draw an Image or Video on a burning photo';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.burn.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBurn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.burn.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBurn.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBurn.createMessage(context, args);
  }
}
