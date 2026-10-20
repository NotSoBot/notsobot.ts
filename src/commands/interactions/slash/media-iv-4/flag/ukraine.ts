import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ukraine';

export class MediaIVFlagUkraineCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Ukrainian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.ukraine.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUkraine.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.ukraine.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUkraine.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUkraine.createMessage(context, args);
  }
}
