import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'england';

export class MediaIVFlagEnglandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an English flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.england.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEngland.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.england.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEngland.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEngland.createMessage(context, args);
  }
}
