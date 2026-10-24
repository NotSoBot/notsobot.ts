import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'southkorea';

export class MediaIVFlagSouthKoreaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a South Korean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.southkorea.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSouthKorea.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.southkorea.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSouthKorea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSouthKorea.createMessage(context, args);
  }
}
