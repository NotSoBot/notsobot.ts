import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'syria';

export class MediaIVFlagSyriaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Syrian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.syria.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSyria.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.syria.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSyria.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSyria.createMessage(context, args);
  }
}
