import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetPostGalleryCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Set how posts with more than one media show in the server';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_post_gallery.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetPostGallery.COMMAND_ID,
  };
  name = 'post-gallery';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_post_gallery.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'Gallery or one per page (Default: Gallery)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_post_gallery.type'),
          choices: Parameters.Slash.POST_GALLERY,
          type: Number,
        },
        {
          name: 'clear',
          description: 'Clear Preference',
          ...I18n.optionLocalizations('commands.settings_server.set.set_post_gallery.clear'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetPostGallery.CommandArgs) {
    return Formatter.Commands.SettingsServerSetPostGallery.createMessage(context, args);
  }
}
