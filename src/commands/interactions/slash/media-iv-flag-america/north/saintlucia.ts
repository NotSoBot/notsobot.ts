import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'saintlucia';

export class MediaIVFlagSaintLuciaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Saint Lucian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.saintlucia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSaintLucia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.saintlucia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaintLucia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaintLucia.createMessage(context, args);
  }
}
