import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'samoa';

export class MediaIVFlagSamoaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Samoan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.samoa.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSamoa.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.samoa.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSamoa.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSamoa.createMessage(context, args);
  }
}
