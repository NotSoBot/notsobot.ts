import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'seychelles';

export class MediaIVFlagSeychellesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Seychellois flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.seychelles.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSeychelles.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.seychelles.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSeychelles.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSeychelles.createMessage(context, args);
  }
}
