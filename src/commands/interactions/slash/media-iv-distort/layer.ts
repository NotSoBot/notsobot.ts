import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'layer';

export class MediaIVLayerCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Tile an Image or Video with its mirrored and flipped copies';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.layer.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLayer.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.layer.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLayer.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLayer.createMessage(context, args);
  }
}
