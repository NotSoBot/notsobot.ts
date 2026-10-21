import { Interaction } from 'detritus-client';

import { MediaFaceHalloweenHats } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


const DEFAULT_HAT = Formatter.Commands.MediaIVManipulationFaceHalloweenHat.DEFAULT_HAT;

export const COMMAND_NAME = 'halloween-hat';

export class MediaIVHalloweenHatCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put a Halloween hat on every face in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.face.halloween_hat.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceHalloweenHat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.halloween_hat.name');

  constructor() {
    super({
      options: [
        {
          name: 'hat',
          description: `Hat (Default: ${DEFAULT_HAT})`,
          ...I18n.optionLocalizations('commands.media_iv_5.face.halloween_hat.hat'),
          choices: Parameters.Slash.oneOf({choices: MediaFaceHalloweenHats, defaultChoice: DEFAULT_HAT}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceHalloweenHat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceHalloweenHat.createMessage(context, args);
  }
}
