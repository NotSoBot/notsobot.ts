import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'right';

export class MediaIVMirrorRightCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Mirror the right half of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.mirror.right.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMirrorRight.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.mirror.right.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMirrorRight.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorRight.createMessage(context, args);
  }
}
