import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'belarus';

export class MediaIVFlagBelarusCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Belarusian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.belarus.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBelarus.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.belarus.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBelarus.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBelarus.createMessage(context, args);
  }
}
