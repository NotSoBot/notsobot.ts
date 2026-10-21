import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'top';

export class MediaIVMirrorTopCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Mirror the top half of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.mirror.top.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMirrorTop.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.mirror.top.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMirrorTop.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorTop.createMessage(context, args);
  }
}
