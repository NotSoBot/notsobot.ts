import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'instant-camera';

export class MediaIVInstantCameraCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video into an instant camera photo';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.instant_camera.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInstantCamera.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.instant_camera.name');

  constructor() {
    super({
      options: [
        {
          name: 'caption',
          description: 'Handwritten caption under the photo',
          ...I18n.optionLocalizations('commands.media_iv_5.fun.instant_camera.caption'),
          label: 'text',
          maxLength: Formatter.Commands.MediaIVManipulationInstantCamera.MAX_CAPTION_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.MediaIVManipulationInstantCamera.MAX_CAPTION_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInstantCamera.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInstantCamera.createMessage(context, args);
  }
}
