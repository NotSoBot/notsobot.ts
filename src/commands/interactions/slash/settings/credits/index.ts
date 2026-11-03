import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { SettingsCreditsBalanceCommand } from './balance';
import { SettingsCreditsGiveCommand } from './give';


export class SettingsCreditsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Your NotSoCredits and this server\'s';
  descriptionLocalizations = I18n.localizations('commands.settings.credits.description');
  name = 'credits';
  nameLocalizations = I18n.localizations('commands.settings.credits.name');

  constructor() {
    super({
      options: [
        new SettingsCreditsBalanceCommand(),
        new SettingsCreditsGiveCommand(),
      ],
    });
  }
}
