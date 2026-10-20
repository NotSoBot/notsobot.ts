import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mexico';

export class MediaIVFlagMexicoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Mexican flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mexico.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMexico.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mexico.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMexico.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMexico.createMessage(context, args);
  }
}
