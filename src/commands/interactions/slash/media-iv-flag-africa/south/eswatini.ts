import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'eswatini';

export class MediaIVFlagEswatiniCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Eswatini flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.eswatini.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEswatini.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.eswatini.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEswatini.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEswatini.createMessage(context, args);
  }
}
