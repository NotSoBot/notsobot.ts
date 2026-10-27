import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'tonga';

export class MediaIVFlagTongaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Tongan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.tonga.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTonga.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.tonga.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTonga.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTonga.createMessage(context, args);
  }
}
