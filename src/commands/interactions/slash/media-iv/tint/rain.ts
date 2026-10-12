import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain';

export class MediaIVRainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Rainbow tint to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.rain.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRain.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.rain.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRain.createMessage(context, args);
  }
}
