import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'tuvalu';

export class MediaIVFlagTuvaluCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Tuvaluan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.tuvalu.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTuvalu.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.tuvalu.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTuvalu.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTuvalu.createMessage(context, args);
  }
}
