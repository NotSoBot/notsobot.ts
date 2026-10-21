import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsPremiumServersAddCommand } from './add';
import { SettingsPremiumServersListCommand } from './list';
import { SettingsPremiumServersRemoveCommand } from './remove';


export class SettingsPremiumServersGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'The servers you gave your premium to';
  descriptionLocalizations = I18n.localizations('commands.settings.premium_servers.description');
  name = 'premium-servers';
  nameLocalizations = I18n.localizations('commands.settings.premium_servers.name');

  constructor() {
    super({
      options: [
        new SettingsPremiumServersAddCommand(),
        new SettingsPremiumServersListCommand(),
        new SettingsPremiumServersRemoveCommand(),
      ],
    });
  }
}
