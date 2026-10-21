import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ripple';

export class MediaIVRippleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Ripple effect on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.fun.ripple.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRipple.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_3.fun.ripple.name');

  constructor() {
    super({
      options: [
        {name: 'amplitude', description: 'Amplitude', ...I18n.optionLocalizations('commands.media_iv_3.fun.ripple.amplitude'), type: Number},
        {name: 'offset', description: 'Offset', ...I18n.optionLocalizations('commands.media_iv_3.fun.ripple.offset'), type: Number},
        {name: 'power', description: 'Power', ...I18n.optionLocalizations('commands.media_iv_3.fun.ripple.power'), type: 'float'},
        {name: 'rmin', description: 'Minimum Radius', ...I18n.optionLocalizations('commands.media_iv_3.fun.ripple.rmin'), type: Number},
        {name: 'width', description: 'Width', ...I18n.optionLocalizations('commands.media_iv_3.fun.ripple.width'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRipple.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRipple.createMessage(context, args);
  }
}
