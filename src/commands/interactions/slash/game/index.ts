import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { GameFlagCommand } from './flag';


// `imagine` joins these once it's public, it's `/owner game imagine` while it's tested
export default class GameGroupCommand extends BaseSlashCommand {
  description = 'Games to play with everyone in the channel';
  descriptionLocalizations = I18n.localizations('commands.game.description');
  name = 'game';
  nameLocalizations = I18n.localizations('commands.game.name');

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
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new GameFlagCommand(),
      ],
    });
  }
}
