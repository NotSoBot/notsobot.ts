import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { OwnerBlockGroupCommand } from './block';
import { OwnerEmojisCommand } from './emojis';
import { OwnerEvalCommand } from './eval';
import { OwnerGameGroupCommand } from './game';
import { OwnerGuildFeaturesGroupCommand } from './guild-features';
import { OwnerRefreshCommand } from './refresh';
import { OwnerSayCommand } from './say';
import { OwnerSeenOnCommand } from './seenon';
import { OwnerShardsLeftCommand } from './shards-left';
import { OwnerUnblockGroupCommand } from './unblock';
import { OwnerUploadCommandsCommand } from './upload-commands';
import { OwnerWarnCommand } from './warn';


export default class OwnerGroupCommand extends BaseSlashCommand {
  description = 'Owner Only Commands';
  descriptionLocalizations = I18n.localizations('commands.owner.description');
  name = 'owner';
  nameLocalizations = I18n.localizations('commands.owner.name');

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
        new OwnerBlockGroupCommand(),
        new OwnerEmojisCommand(),
        new OwnerEvalCommand(),
        // the games being tested, `/games` once they're public
        new OwnerGameGroupCommand(),
        new OwnerGuildFeaturesGroupCommand(),
        new OwnerRefreshCommand(),
        new OwnerSayCommand(),
        new OwnerSeenOnCommand(),
        new OwnerShardsLeftCommand(),
        new OwnerUnblockGroupCommand(),
        new OwnerUploadCommandsCommand(),
        new OwnerWarnCommand(),
      ],
    });
  }
}
