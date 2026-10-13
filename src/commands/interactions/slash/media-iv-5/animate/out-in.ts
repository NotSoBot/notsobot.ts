import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'out-in';

export class MediaIVOutInCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Zoom out of an Image or Video through copies of itself and back in';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.animate.out_in.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOutIn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.animate.out_in.name');

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Frame Delay in ms (20..10000) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_3.animate.out_in.delay'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOutIn.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOutIn.createMessage(context, args);
  }
}
