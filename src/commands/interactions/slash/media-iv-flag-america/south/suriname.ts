import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'suriname';

export class MediaIVFlagSurinameCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Surinamese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.suriname.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSuriname.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.suriname.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSuriname.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSuriname.createMessage(context, args);
  }
}
