import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'turkmenistan';

export class MediaIVFlagTurkmenistanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Turkmen flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.turkmenistan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTurkmenistan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.turkmenistan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTurkmenistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTurkmenistan.createMessage(context, args);
  }
}
