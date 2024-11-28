import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { TagAliasCommand } from './alias';
import { TagCommandsGroupCommand } from './commands';
import { TagCreateCommand } from './create';
import { TagExportCommand } from './export';
import { TagImportGroupCommand } from './import';
import { TagInfoCommand } from './info';
import { TagListGroupCommand } from './list';
import { TagRandomCommand } from './random';
import { TagRemoveGroupCommand } from './remove';
import { TagShowCommand } from './show';


export default class TagGroupCommand extends BaseSlashCommand {
  description = 'Custom Tags';
  name = 'tag';

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
        new TagShowCommand(),
        new TagAliasCommand(),
        new TagCommandsGroupCommand(),
        new TagCreateCommand(),
        new TagExportCommand(),
        new TagImportGroupCommand(),
        new TagInfoCommand(),
        new TagRandomCommand(),
        new TagRemoveGroupCommand(),
        new TagListGroupCommand(),
      ],
    });
  }
}
