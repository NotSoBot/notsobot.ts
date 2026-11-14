import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bottom';

export class MediaIVMirrorBottomCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Mirror the bottom half of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.mirror.bottom.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMirrorBottom.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.mirror.bottom.name');

  constructor() {
    super({
      options: [
        {name: 'percentage', description: 'How Much of the Media the Reflection Covers (1..99) (Default: 50)', ...I18n.optionLocalizations('commands.media_iv_4.mirror.bottom.percentage'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMirrorBottom.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorBottom.createMessage(context, args);
  }
}
