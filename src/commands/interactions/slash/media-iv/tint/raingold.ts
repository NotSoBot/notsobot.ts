import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain-gold';

export class MediaIVRainGoldCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rainbowish Gold tintify an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.raingold.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRainGold.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.raingold.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRainGold.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRainGold.createMessage(context, args);
  }
}
