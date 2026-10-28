import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetFallbacksMediaImageCommand extends BaseInteractionCommandOption {
  description = 'Set what image commands do when you don\'t give an image';
  descriptionLocalizations = I18n.localizations('commands.settings.set.fallbacks_media_image.description');
  metadata = {
    id: Formatter.Commands.SettingsSetFallbacksMediaImage.COMMAND_ID,
  };
  name = 'fallbacks-media-image';
  nameLocalizations = I18n.localizations('commands.settings.set.fallbacks_media_image.name');

  constructor() {
    super({
      options: [
        {
          name: 'fallback',
          description: 'Image Fallback Type (Default: Search Google Images)',
          ...I18n.optionLocalizations('commands.settings.set.fallbacks_media_image.fallback'),
          choices: Parameters.Slash.USER_SETTINGS_FALLBACKS_MEDIA_IMAGE_TYPES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetFallbacksMediaImage.CommandArgs) {
    return Formatter.Commands.SettingsSetFallbacksMediaImage.createMessage(context, args);
  }
}
