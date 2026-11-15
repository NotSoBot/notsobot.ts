import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'togo';

export class MediaIVFlagTogoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Togolese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.togo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTogo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.togo.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTogo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTogo.createMessage(context, args);
  }
}
