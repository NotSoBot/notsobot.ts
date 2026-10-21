import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'side-to-side';

export class MediaIVSideToSideCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Flip an Image or Video back and forth horizontally';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.animate.side_to_side.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSideToSide.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.animate.side_to_side.name');

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Frame Delay in ms (20..10000) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_5.animate.side_to_side.delay'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSideToSide.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSideToSide.createMessage(context, args);
  }
}
