import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'motion-blur';

export class MediaIVMotionBlurCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Motion Blur to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.motion_blur.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMotionBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.motion_blur.name');
  
  constructor() {
    super({
      options: [
        {name: 'strength', description: 'Blur Strength Amount (1..50) (Default: 20)', ...I18n.optionLocalizations('commands.media_iv_2.fun.motion_blur.strength'), type: Number},
        {name: 'vertical', description: 'Vertical Blur', ...I18n.optionLocalizations('commands.media_iv_2.fun.motion_blur.vertical'), type: Boolean},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMotionBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMotionBlur.createMessage(context, args);
  }
}
