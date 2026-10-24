import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { FunGameGroupCommand } from '../fun/game';

import { OwnerBlockGroupCommand } from './block';
import { OwnerEmojisCommand } from './emojis';
import { OwnerEvalCommand } from './eval';
import { OwnerGuildFeaturesGroupCommand } from './guild-features';
import { OwnerRefreshCommand } from './refresh';
import { OwnerSayCommand } from './say';
import { OwnerSeenOnCommand } from './seenon';
import { OwnerShardsLeftCommand } from './shards-left';
import { OwnerUnblockGroupCommand } from './unblock';
import { OwnerUploadCommandsCommand } from './upload-commands';


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
        // owner only while it's tested, `/fun game` once it's public
        new FunGameGroupCommand(),
        new OwnerGuildFeaturesGroupCommand(),
        new OwnerRefreshCommand(),
        new OwnerSayCommand(),
        new OwnerSeenOnCommand(),
        new OwnerShardsLeftCommand(),
        new OwnerUnblockGroupCommand(),
        new OwnerUploadCommandsCommand(),
      ],
    });
  }
}
