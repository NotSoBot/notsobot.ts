import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'congo';

export class MediaIVFlagCongoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Republic of the Congo flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.congo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCongo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.congo.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCongo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCongo.createMessage(context, args);
  }
}
