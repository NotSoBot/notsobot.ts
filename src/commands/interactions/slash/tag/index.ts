import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { TagAddCommand } from './add';
import { TagAliasCommand } from './alias';
import { TagCommandsGroupCommand } from './commands';
import { TagCreateCommand } from './create';
import { TagDirectoryGroupCommand } from './directory';
import { TagEditCommand } from './edit';
import { TagExportCommand } from './export';
import { TagImportCommand } from './import';
import { TagInfoCommand } from './info';
import { TagListGroupCommand } from './list';
import { TagRandomCommand } from './random';
import { TagRemoveGroupCommand } from './remove';
import { TagRenameCommand } from './rename';
import { TagShowCommand } from './show';
import { TagStorageGroupCommand } from './storage';


export default class TagGroupCommand extends BaseSlashCommand {
  description = 'Custom Tags';
  descriptionLocalizations = I18n.localizations('commands.tag.description');
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
        new TagAddCommand(),
        new TagAliasCommand(),
        new TagCommandsGroupCommand(),
        new TagCreateCommand(),
        new TagDirectoryGroupCommand(),
        new TagEditCommand(),
        new TagExportCommand(),
        new TagImportCommand(),
        new TagInfoCommand(),
        new TagRandomCommand(),
        new TagRemoveGroupCommand(),
        new TagRenameCommand(),
        new TagListGroupCommand(),
        new TagStorageGroupCommand(),
      ],
    });
  }
}
