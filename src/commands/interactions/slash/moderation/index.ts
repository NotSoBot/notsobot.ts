import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ModerationBanCommand } from './ban';
import { ModerationCleanCommand } from './clean';
import { ModerationKickCommand } from './kick';
import { ModerationMuteCommand } from './mute';
import { ModerationNickCommand } from './nick';
import { ModerationNickMassGroupCommand } from './nick-mass';
import { ModerationPinCommand } from './pin';
import { ModerationPruneCommand } from './prune';
import { ModerationReportsCommand } from './reports';
import { ModerationUnbanCommand } from './unban';
import { ModerationUnmuteCommand } from './unmute';
import { ModerationWarnCommand } from './warn';
import { ModerationWarningsGroupCommand } from './warnings';


export default class ModerationGroupCommand extends BaseSlashCommand {
  description = 'Moderate members: ban, kick, mute, clean and more';
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
        new ModerationBanCommand(),
        new ModerationCleanCommand(),
        new ModerationKickCommand(),
        new ModerationMuteCommand(),
        new ModerationNickCommand(),
        new ModerationNickMassGroupCommand(),
        new ModerationPinCommand(),
        new ModerationPruneCommand(),
        new ModerationReportsCommand(),
        new ModerationUnbanCommand(),
        new ModerationUnmuteCommand(),
        new ModerationWarnCommand(),
        new ModerationWarningsGroupCommand(),
      ],
    });
  }
}
