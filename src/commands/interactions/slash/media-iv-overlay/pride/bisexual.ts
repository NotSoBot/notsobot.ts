import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bisexual';

export class MediaIVFlagBisexualCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bisexual pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bisexual.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBisexual.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bisexual.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBisexual.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBisexual.createMessage(context, args);
  }
}
