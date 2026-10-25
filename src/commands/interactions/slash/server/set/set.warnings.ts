import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { MAX_GUILD_WARNING_USER_AMOUNT } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerSetWarningsCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'See or change how long warnings stay active and when they get deleted';
  descriptionLocalizations = I18n.localizations('commands.settings_server.set.set_warnings.description');
  metadata = {
    id: Formatter.Commands.SettingsServerSetWarnings.COMMAND_ID,
  };
  name = 'warnings';
  nameLocalizations = I18n.localizations('commands.settings_server.set.set_warnings.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'window',
          description: 'How long a warning counts as active, like 14d or 2 months (Default: 30 days)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.window'),
          value: Formatter.Commands.SettingsServerSetWarnings.windowParser,
        },
        {
          name: 'expire',
          description: 'Delete warnings after this long, like 90d or 1 year, or never (Default: never)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.expire'),
          value: Formatter.Commands.SettingsServerSetWarnings.expireParser,
        },
        {
          name: 'step',
          description: 'Active warnings that set off an action, like 3 (pick an action too)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.step'),
          maxValue: MAX_GUILD_WARNING_USER_AMOUNT,
          minValue: 1,
          type: ApplicationCommandOptionTypes.INTEGER,
        },
        {
          name: 'action',
          description: 'What happens at that step',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.action'),
          choices: [
            Parameters.Slash.createChoice('Mute', 'mute', {localizationKey: 'moderation_warn.mute'}),
            Parameters.Slash.createChoice('Kick', 'kick', {localizationKey: 'moderation_warn.kick'}),
            Parameters.Slash.createChoice('Ban', 'ban', {localizationKey: 'moderation_warn.ban'}),
            Parameters.Slash.createChoice('Remove Step', 'remove', {localizationKey: 'settings_server_set_warnings.action_remove'}),
          ],
        },
        {
          name: 'duration',
          description: 'How long the mute or ban lasts, like 1h or 7d (Mute default: 1 hour, Ban default: permanent)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.duration'),
          value: Formatter.Commands.SettingsServerSetWarnings.durationParser,
        },
        {
          name: 'clean',
          description: 'Delete their messages from this far back on a kick or ban, like 1d (Max: 7 days)',
          ...I18n.optionLocalizations('commands.settings_server.set.set_warnings.clean'),
          value: Formatter.Commands.SettingsServerSetWarnings.durationParser,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SettingsServerSetWarnings.CommandArgs) {
    return Formatter.Commands.SettingsServerSetWarnings.createMessage(context, args);
  }
}
