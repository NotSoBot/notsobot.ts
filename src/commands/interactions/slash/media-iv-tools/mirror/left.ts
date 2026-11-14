import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'left';

export class MediaIVMirrorLeftCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Mirror the left half of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.mirror.left.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMirrorLeft.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.mirror.left.name');

  constructor() {
    super({
      options: [
        {name: 'percentage', description: 'How Much of the Media the Reflection Covers (1..99) (Default: 50)', ...I18n.optionLocalizations('commands.media_iv_4.mirror.left.percentage'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMirrorLeft.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorLeft.createMessage(context, args);
  }
}
