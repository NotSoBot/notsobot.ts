import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'senegal';

export class MediaIVFlagSenegalCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Senegalese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.senegal.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSenegal.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.senegal.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSenegal.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSenegal.createMessage(context, args);
  }
}
