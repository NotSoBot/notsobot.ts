import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'lesbian';

export class MediaIVFlagLesbianCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Lesbian pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.lesbian.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLesbian.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.lesbian.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLesbian.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLesbian.createMessage(context, args);
  }
}
