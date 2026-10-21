import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'norway';

export class MediaIVFlagNorwayCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Norwegian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.norway.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNorway.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.norway.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNorway.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNorway.createMessage(context, args);
  }
}
