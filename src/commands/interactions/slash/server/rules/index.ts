import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerRulesAddCommand } from './add';
import { ServerRulesAdminBypassCommand } from './admin-bypass';
import { ServerRulesCheckCommand } from './check';
import { ServerRulesClearCommand } from './clear';
import { ServerRulesListCommand } from './list';
import { ServerRulesRemoveCommand } from './remove';


export class ServerRulesGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Block or allow commands for channels, roles, and users';
  descriptionLocalizations = I18n.localizations('commands.rules.description');
  name = 'rules';
  nameLocalizations = I18n.localizations('commands.rules.name');

  constructor() {
    super({
      options: [
        new ServerRulesAddCommand(),
        new ServerRulesAdminBypassCommand(),
        new ServerRulesCheckCommand(),
        new ServerRulesClearCommand(),
        new ServerRulesListCommand(),
        new ServerRulesRemoveCommand(),
      ],
    });
  }
}
