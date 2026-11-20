import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';



export class SettingsSetPostGalleryCommand extends BaseInteractionCommandOption {
  description = 'Set how posts with more than one media show for you';
  descriptionLocalizations = I18n.localizations('commands.settings.set.post_gallery.description');
  metadata = {
    id: Formatter.Commands.SettingsSetPostGallery.COMMAND_ID,
  };
  name = 'post-gallery';
  nameLocalizations = I18n.localizations('commands.settings.set.post_gallery.name');

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Gallery or one per page (Default: Server Setting)',
          ...I18n.optionLocalizations('commands.settings.set.post_gallery.type'),
          choices: Parameters.Slash.POST_GALLERY,
          type: Number,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings.set.post_gallery.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsSetPostGallery.CommandArgs) {
    return Formatter.Commands.SettingsSetPostGallery.createMessage(context, args);
  }
}
