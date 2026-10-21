import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bosnia';

export class MediaIVFlagBosniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bosnian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bosnia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBosnia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bosnia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBosnia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBosnia.createMessage(context, args);
  }
}
