import { Interaction } from 'detritus-client';

import { MediaEyeTypes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_LIGHTNING_TYPES } from './options';


export const COMMAND_NAME = 'lightning';

export class MediaIVEyesLightningCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make people\'s eyes glow and crackle with lightning in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.lightning.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesLightning.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.lightning.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: 'Lightning Color',
          ...I18n.optionLocalizations('commands.media_iv_4.eyes.lightning.color'),
          choices: Parameters.Slash.oneOf({
            choices: EYES_LIGHTNING_TYPES,
            defaultChoice: MediaEyeTypes.LIGHTNING_PINK,
            localizationKey: 'choices.media_eye_types',
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesLightning.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesLightning.createMessage(context, args);
  }
}
