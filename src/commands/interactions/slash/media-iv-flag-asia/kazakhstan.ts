import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'kazakhstan';

export class MediaIVFlagKazakhstanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Kazakh flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.kazakhstan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagKazakhstan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.kazakhstan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagKazakhstan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKazakhstan.createMessage(context, args);
  }
}
