import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'lithuania';

export class MediaIVFlagLithuaniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Lithuanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.lithuania.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLithuania.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.lithuania.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLithuania.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLithuania.createMessage(context, args);
  }
}
