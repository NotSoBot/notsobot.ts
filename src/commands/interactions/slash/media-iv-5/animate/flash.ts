import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flash';

export class MediaIVFlashCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Flash an Image or Video between normal and inverted';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.animate.flash.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFlash.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.animate.flash.name');

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Frame Delay in ms (20..10000) (Default: 100)', ...I18n.optionLocalizations('commands.media_iv_5.animate.flash.delay'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFlash.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlash.createMessage(context, args);
  }
}
