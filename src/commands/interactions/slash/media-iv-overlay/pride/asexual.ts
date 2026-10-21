import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'asexual';

export class MediaIVFlagAsexualCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Asexual pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.asexual.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAsexual.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.asexual.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAsexual.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAsexual.createMessage(context, args);
  }
}
