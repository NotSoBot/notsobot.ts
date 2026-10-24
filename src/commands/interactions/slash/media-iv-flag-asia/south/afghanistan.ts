import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'afghanistan';

export class MediaIVFlagAfghanistanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Afghan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.afghanistan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAfghanistan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.afghanistan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAfghanistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAfghanistan.createMessage(context, args);
  }
}
