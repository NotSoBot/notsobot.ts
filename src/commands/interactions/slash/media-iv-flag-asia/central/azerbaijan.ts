import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'azerbaijan';

export class MediaIVFlagAzerbaijanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Azerbaijani flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.azerbaijan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAzerbaijan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.azerbaijan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAzerbaijan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAzerbaijan.createMessage(context, args);
  }
}
