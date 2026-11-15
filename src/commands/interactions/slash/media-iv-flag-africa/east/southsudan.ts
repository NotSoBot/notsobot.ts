import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'southsudan';

export class MediaIVFlagSouthSudanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a South Sudanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.southsudan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSouthSudan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.southsudan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSouthSudan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSouthSudan.createMessage(context, args);
  }
}
