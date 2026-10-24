import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'uzbekistan';

export class MediaIVFlagUzbekistanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Uzbek flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.uzbekistan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUzbekistan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.uzbekistan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUzbekistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUzbekistan.createMessage(context, args);
  }
}
