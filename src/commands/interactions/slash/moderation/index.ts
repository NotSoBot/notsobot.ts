import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ModerationAllowlistGroupCommand } from './allowlist';
import { ModerationBanCommand } from './ban';
import { ModerationBlocklistGroupCommand } from './blocklist';
import { ModerationKickCommand } from './kick';
import { ModerationLoggersGroupCommand } from './loggers';
import { ModerationNickMassGroupCommand } from './nick-mass';
import { ModerationPruneCommand } from './prune';
import { ModerationUnbanCommand } from './unban';


export default class ModerationGroupCommand extends BaseSlashCommand {
  description = 'Moderation Commands';
  descriptionLocalizations = I18n.localizations('commands.moderation.description');
  name = 'moderation';
  nameLocalizations = I18n.localizations('commands.moderation.name');

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
        new ModerationLoggersGroupCommand(),
        new ModerationNickMassGroupCommand(),
        new ModerationPruneCommand(),
        new ModerationUnbanCommand(),
      ],
    });
  }
}
