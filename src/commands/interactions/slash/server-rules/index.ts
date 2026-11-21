import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ServerRulesAddCommand } from './add';
import { ServerRulesAdminBypassCommand } from './admin-bypass';
import { ServerRulesCheckCommand } from './check';
import { ServerRulesClearCommand } from './clear';
import { ServerRulesIntegrationsCommand } from './integrations';
import { ServerRulesListCommand } from './list';
import { ServerRulesRemoveCommand } from './remove';


// its own group (was /server rules), /server is close to discord's 8000 character limit. the subcommands keep their
// command ids, so usage, rules and prefix tips follow them
export default class ServerRulesGroupCommand extends BaseSlashCommand {
  description = 'Block or allow commands for channels, roles, and users';
  descriptionLocalizations = I18n.localizations('commands.rules.description');
  name = 'server-rules';

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new ServerRulesAddCommand(),
        new ServerRulesAdminBypassCommand(),
        new ServerRulesCheckCommand(),
        new ServerRulesClearCommand(),
        new ServerRulesIntegrationsCommand(),
        new ServerRulesListCommand(),
        new ServerRulesRemoveCommand(),
      ],
    });
  }
}
