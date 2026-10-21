import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'andorra';

export class MediaIVFlagAndorraCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Andorran flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.andorra.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAndorra.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.andorra.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAndorra.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAndorra.createMessage(context, args);
  }
}
