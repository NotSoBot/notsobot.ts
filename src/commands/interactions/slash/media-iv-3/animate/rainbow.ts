import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rainbow';

export class MediaIVRainbowCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Cycle an Image or Video through rainbow color tints';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.animate.rainbow.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRainbow.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.animate.rainbow.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRainbow.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRainbow.createMessage(context, args);
  }
}
