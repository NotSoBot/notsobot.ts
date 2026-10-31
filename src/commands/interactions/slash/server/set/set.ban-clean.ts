import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';
import { CLEAN_CHOICES } from '../../moderation/ban';


export class ServerSetBanCleanCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'See or change how far back bans delete messages when the moderator doesn\'t pick';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_ban_clean.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetBanClean.COMMAND_ID,
  };
  name = 'ban-clean';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_ban_clean.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'clean',
          description: 'How far back a ban deletes messages when the moderator doesn\'t pick (Default: 24 hours)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_ban_clean.clean'),
          choices: CLEAN_CHOICES,
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetBanClean.CommandArgs) {
    return Formatter.Commands.SettingsServerSetBanClean.createMessage(context, args);
  }
}
