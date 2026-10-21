import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'in-out';

export class MediaIVInOutCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Zoom into an Image or Video through copies of itself and back out';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.animate.in_out.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInOut.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.animate.in_out.name');

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Frame Delay in ms (20..10000) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_5.animate.in_out.delay'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInOut.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInOut.createMessage(context, args);
  }
}
