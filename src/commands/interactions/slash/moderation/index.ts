import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ModerationAllowlistGroupCommand } from './allowlist';
import { ModerationBanCommand } from './ban';
import { ModerationBlocklistGroupCommand } from './blocklist';
import { ModerationKickCommand } from './kick';
import { ModerationUnbanCommand } from './unban';


export default class ModerationGroupCommand extends BaseSlashCommand {
  description = 'Moderation Commands';
  name = 'moderation';

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new ModerationAllowlistGroupCommand(),
        new ModerationBanCommand(),
        new ModerationBlocklistGroupCommand(),
        new ModerationKickCommand(),
        new ModerationUnbanCommand(),
      ],
    });
  }
}
