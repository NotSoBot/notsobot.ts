import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'chad';

export class MediaIVFlagChadCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Chadian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.chad.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagChad.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.chad.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagChad.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagChad.createMessage(context, args);
  }
}
