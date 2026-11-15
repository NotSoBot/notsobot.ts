import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'eritrea';

export class MediaIVFlagEritreaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Eritrean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.eritrea.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEritrea.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.eritrea.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEritrea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEritrea.createMessage(context, args);
  }
}
