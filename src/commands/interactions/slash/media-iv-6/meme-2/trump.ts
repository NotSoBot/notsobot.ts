import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'trump';

export class MediaIVMemeTrump1Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on a sign held up by Donald Trump';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.trump.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPersonsTrump1.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.trump.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPersonsTrump1.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPersonsTrump1.createMessage(context, args);
  }
}
