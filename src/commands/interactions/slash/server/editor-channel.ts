import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'editor-channel';

// an App Channel bound to NotSoBot: the media editor and games open inline, with the channel's chat beside them
export class ServerEditorChannelCommand extends BaseInteractionCommandOption {
  description = 'Make a channel with the NotSoBot editor and games built in';
  descriptionLocalizations = I18n.localizations('commands.server.editor_channel.description');
  metadata = {
    id: Formatter.Commands.ServerEditorChannel.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.server.editor_channel.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_CHANNELS],
      permissionsClient: [Permissions.MANAGE_CHANNELS],
      // a new channel each run, a server only has so many
      ratelimits: [{duration: 60 * 1000, limit: 2, type: 'guild'}],
      options: [
        {
          name: 'name',
          description: 'The channel\'s name (Default: notsobot)',
          ...I18n.optionLocalizations('commands.server.editor_channel.name_option'),
          maxLength: 100,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ServerEditorChannel.CommandArgs) {
    // `permissions` above is checked in the channel the command was run in, where an overwrite can give Manage Channel
    // for that one channel. the new channel is the server's, so it takes the permission from their roles (what Discord
    // asks of someone making a channel themselves)
    const { guild, member } = context;
    if (guild && member && this.onPermissionsFail && !guild.can(Permissions.MANAGE_CHANNELS, member)) {
      return this.onPermissionsFail(context, [Permissions.MANAGE_CHANNELS]);
    }
    return Formatter.Commands.ServerEditorChannel.createMessage(context, args);
  }
}
