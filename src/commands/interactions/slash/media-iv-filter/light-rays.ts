import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'light-rays';

export class MediaIVLightRaysCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Streak the bright parts of an Image or Video out into rays, like VEGAS\' Light Rays';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.light_rays.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLightRays.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.light_rays.name');

  constructor() {
    super({
      options: [
        {name: 'sensitivity', description: 'How much of the brightness makes rays, 1 is all of it (0..1) (Default: 0.5)', ...I18n.optionLocalizations('commands.media_iv_5.fun.light_rays.sensitivity'), type: Number},
        {name: 'strength', description: 'How long and bright the rays are, 1 is VEGAS\' strongest (0..2) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_5.fun.light_rays.strength'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLightRays.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLightRays.createMessage(context, args);
  }
}
