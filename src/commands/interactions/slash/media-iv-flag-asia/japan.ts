import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'japan';

export class MediaIVFlagJapanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Japanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.japan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagJapan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.japan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagJapan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagJapan.createMessage(context, args);
  }
}
