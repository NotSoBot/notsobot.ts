import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'scotland';

export class MediaIVFlagScotlandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Scottish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.scotland.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagScotland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.scotland.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagScotland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagScotland.createMessage(context, args);
  }
}
