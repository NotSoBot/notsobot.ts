import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'triggered';

export class MediaIVTriggeredCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shake an Image or Video and attach a Triggered Label';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.triggered.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationShakeTriggered.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationShakeTriggered.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationShakeTriggered.createMessage(context, args);
  }
}
