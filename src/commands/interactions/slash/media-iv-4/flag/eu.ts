import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'eu';

export class MediaIVFlagEUCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an EU flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.eu.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEU.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.eu.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEU.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEU.createMessage(context, args);
  }
}
