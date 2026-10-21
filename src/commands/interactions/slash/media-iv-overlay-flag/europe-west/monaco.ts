import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'monaco';

export class MediaIVFlagMonacoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Monegasque flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.monaco.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMonaco.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.monaco.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMonaco.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMonaco.createMessage(context, args);
  }
}
