import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'miranda';

export class MediaIVMemeMirandaCosgrove1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a car window behind Miranda Cosgrove';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.miranda.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsMirandaCosgrove1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.miranda.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsMirandaCosgrove1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsMirandaCosgrove1.createMessage(context, args);
  }
}
