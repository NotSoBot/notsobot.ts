import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'yemen';

export class MediaIVFlagYemenCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Yemeni flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.yemen.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagYemen.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.yemen.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagYemen.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagYemen.createMessage(context, args);
  }
}
