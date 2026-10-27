import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mlm';

export class MediaIVFlagMLMCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an MLM pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mlm.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMLM.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mlm.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMLM.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMLM.createMessage(context, args);
  }
}
