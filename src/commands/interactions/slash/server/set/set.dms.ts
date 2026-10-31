import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetDmsCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'See or change which moderation DMs members get (bans, kicks, mutes, warnings)';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_dms.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetDms.COMMAND_ID,
  };
  name = 'dms';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_dms.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'dm',
          description: 'DM members when they\'re banned, kicked, muted or warned (Default: on)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_dms.dm'),
          type: Boolean,
        },
        {
          name: 'for',
          description: 'Only turn this DM on or off (Default: all of them)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_dms.for'),
          choices: [
            Parameters.Slash.createChoice('Bans', 'ban', {localizationKey: 'settings_server_moderation.kind_ban'}),
            Parameters.Slash.createChoice('Kicks', 'kick', {localizationKey: 'settings_server_moderation.kind_kick'}),
            Parameters.Slash.createChoice('Mutes', 'mute', {localizationKey: 'settings_server_moderation.kind_mute'}),
            Parameters.Slash.createChoice('Warnings', 'warn', {localizationKey: 'settings_server_moderation.kind_warn'}),
            Parameters.Slash.createChoice('Auto-warnings', 'autowarn', {localizationKey: 'settings_server_moderation.kind_autowarn'}),
          ],
          value: Formatter.Commands.SettingsServerSetDms.forSlashParser,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetDms.CommandArgs) {
    return Formatter.Commands.SettingsServerSetDms.createMessage(context, args);
  }
}
