import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bolivia';

export class MediaIVFlagBoliviaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bolivian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bolivia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBolivia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bolivia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBolivia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBolivia.createMessage(context, args);
  }
}
