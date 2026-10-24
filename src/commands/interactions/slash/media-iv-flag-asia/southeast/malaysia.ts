import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'malaysia';

export class MediaIVFlagMalaysiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Malaysian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.malaysia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMalaysia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.malaysia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMalaysia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMalaysia.createMessage(context, args);
  }
}
