import { Interaction } from 'detritus-client';

import { MediaEyeTypes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_LASER_TYPES } from './options';


export const COMMAND_NAME = 'laser';

export class MediaIVEyesLaserCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shoot laser beams out of people\'s eyes in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.laser.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyesLaser.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.laser.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: 'Laser Color',
          ...I18n.optionLocalizations('commands.media_iv_4.eyes.laser.color'),
          choices: Parameters.Slash.oneOf({
            choices: EYES_LASER_TYPES,
            defaultChoice: MediaEyeTypes.LASER_YELLOW,
            localizationKey: 'choices.media_eye_types',
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyesLaser.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyesLaser.createMessage(context, args);
  }
}
