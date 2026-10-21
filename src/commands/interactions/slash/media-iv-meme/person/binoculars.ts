import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'binoculars';

export class MediaIVMemeBinocularsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Look at an Image or Video through a pair of binoculars';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.binoculars.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayBinoculars.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.binoculars.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayBinoculars.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayBinoculars.createMessage(context, args);
  }
}
