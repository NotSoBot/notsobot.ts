import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { InfoActivityCommand } from './activity';
import { InfoApplicationsCommand } from './applications';
import { InfoAvatarCommand } from './avatar';
import { InfoChannelCommand } from './channel';
import { InfoGuildCommand } from './guild';
import { InfoGuildIconCommand } from './guild-icon';
import { InfoInviteCommand } from './invite';
import { InfoPlayingCommand } from './playing';
import { InfoRoleCommand } from './role';
import { InfoUserCommand } from './user';
import { InfoUsersCommand } from './users';


export default class InfoGroupCommand extends BaseSlashCommand {
  description = 'Info about users, servers, channels, roles and more';
  descriptionLocalizations = I18n.localizations('commands.info.description');
  name = 'info';
  nameLocalizations = I18n.localizations('commands.info.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new InfoActivityCommand(),
        new InfoApplicationsCommand(),
        new InfoAvatarCommand(),
        new InfoChannelCommand(),
        new InfoGuildCommand(),
        new InfoGuildIconCommand(),
        new InfoInviteCommand(),
        new InfoPlayingCommand(),
        new InfoRoleCommand(),
        new InfoUserCommand(),
        new InfoUsersCommand(),
      ],
    });
  }
}
