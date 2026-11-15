import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'lesotho';

export class MediaIVFlagLesothoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Lesotho flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.lesotho.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLesotho.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.lesotho.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLesotho.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLesotho.createMessage(context, args);
  }
}
