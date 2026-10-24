import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'egypt';

export class MediaIVFlagEgyptCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Egyptian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.egypt.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEgypt.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.egypt.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEgypt.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEgypt.createMessage(context, args);
  }
}
