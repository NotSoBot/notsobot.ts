import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'liechtenstein';

export class MediaIVFlagLiechtensteinCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Liechtenstein flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.liechtenstein.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLiechtenstein.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.liechtenstein.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLiechtenstein.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLiechtenstein.createMessage(context, args);
  }
}
