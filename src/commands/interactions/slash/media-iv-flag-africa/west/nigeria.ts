import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'nigeria';

export class MediaIVFlagNigeriaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Nigerian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.nigeria.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNigeria.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.nigeria.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNigeria.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNigeria.createMessage(context, args);
  }
}
