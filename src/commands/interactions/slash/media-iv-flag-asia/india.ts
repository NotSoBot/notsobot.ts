import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'india';

export class MediaIVFlagIndiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Indian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.india.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIndia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.india.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIndia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIndia.createMessage(context, args);
  }
}
