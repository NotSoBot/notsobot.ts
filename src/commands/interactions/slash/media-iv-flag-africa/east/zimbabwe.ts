import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'zimbabwe';

export class MediaIVFlagZimbabweCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Zimbabwean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.zimbabwe.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagZimbabwe.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.zimbabwe.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagZimbabwe.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagZimbabwe.createMessage(context, args);
  }
}
