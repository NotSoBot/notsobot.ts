import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mongolia';

export class MediaIVFlagMongoliaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Mongolian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mongolia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMongolia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mongolia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMongolia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMongolia.createMessage(context, args);
  }
}
