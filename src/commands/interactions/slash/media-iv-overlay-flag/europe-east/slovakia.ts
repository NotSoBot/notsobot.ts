import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'slovakia';

export class MediaIVFlagSlovakiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Slovak flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.slovakia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSlovakia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.slovakia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSlovakia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSlovakia.createMessage(context, args);
  }
}
