import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFallbacksMediaImageCommand extends BaseInteractionCommandOption {
  description = 'Set what your Image Fallback should be for commands';
  metadata = {
    id: Formatter.Commands.SettingsSetFallbacksMediaImage.COMMAND_ID,
  };
  name = 'fallbacks-media-image';

  constructor() {
    super({
      options: [
        {
          name: 'fallback',
          description: 'Image Fallback Type (Default: Search Google Images)',
          choices: Parameters.Slash.USER_FALLBACKS_MEDIA_IMAGE_TYPES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFallbacksMediaImage.CommandArgs) {
    return Formatter.Commands.SettingsSetFallbacksMediaImage.createMessage(context, args);
  }
}
