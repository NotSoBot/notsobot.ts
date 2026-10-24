import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'nepal';

export class MediaIVFlagNepalCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Nepali flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.nepal.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNepal.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.nepal.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNepal.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNepal.createMessage(context, args);
  }
}
