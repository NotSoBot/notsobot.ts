import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';

import { EYES_FLIPPED_OPTION, EYES_STICKER_TYPES } from './options';


export const COMMAND_NAME = 'default';

export class MediaIVEyesDefaultCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Attach eyes to people\'s faces in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.default.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEyes.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.default.name');

  constructor() {
    super({
      options: [
        EYES_FLIPPED_OPTION,
        {
          name: 'type',
          description: 'Eye Type',
          ...I18n.optionLocalizations('commands.media_iv_4.eyes.default.type'),
          choices: Parameters.Slash.oneOf({choices: EYES_STICKER_TYPES, localizationKey: 'choices.media_eye_types'}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEyes.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEyes.createMessage(context, args);
  }
}
