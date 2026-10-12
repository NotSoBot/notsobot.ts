import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'solarize';

export class MediaIVSolarizeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Solarize Effect to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.tint.solarize.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSolarize.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.tint.solarize.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSolarize.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSolarize.createMessage(context, args);
  }
}
