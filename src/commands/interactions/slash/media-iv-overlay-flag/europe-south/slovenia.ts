import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'slovenia';

export class MediaIVFlagSloveniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Slovenian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.slovenia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSlovenia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.slovenia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSlovenia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSlovenia.createMessage(context, args);
  }
}
