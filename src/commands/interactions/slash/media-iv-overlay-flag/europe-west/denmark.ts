import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'denmark';

export class MediaIVFlagDenmarkCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Danish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.denmark.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagDenmark.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.denmark.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagDenmark.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDenmark.createMessage(context, args);
  }
}
