import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'saudiarabia';

export class MediaIVFlagSaudiArabiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Saudi Arabian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.saudiarabia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSaudiArabia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.saudiarabia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaudiArabia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaudiArabia.createMessage(context, args);
  }
}
