import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ModerationWarningsClearCommand } from './clear';
import { ModerationWarningsListCommand } from './list';
import { ModerationWarningsRemoveCommand } from './remove';


export class ModerationWarningsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'See and remove members\' warnings';
  descriptionLocalizations = I18n.localizations('commands.moderation.warnings.description');
  name = 'warnings';
  nameLocalizations = I18n.localizations('commands.moderation.warnings.name');

  constructor() {
    super({
      options: [
        new ModerationWarningsClearCommand(),
        new ModerationWarningsListCommand(),
        new ModerationWarningsRemoveCommand(),
      ],
    });
  }
}
