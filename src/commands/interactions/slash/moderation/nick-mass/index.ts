import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ModerationNickMassCancelCommand } from './cancel';
import { ModerationNickMassResetCommand } from './reset';
import { ModerationNickMassSetCommand } from './set';


export class ModerationNickMassGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Change the nicknames of multiple members';
  descriptionLocalizations = I18n.localizations('commands.moderation.nick_mass.description');
  name = 'nick-mass';
  nameLocalizations = I18n.localizations('commands.moderation.nick_mass.name');

  constructor() {
    super({
      options: [
        new ModerationNickMassCancelCommand(),
        new ModerationNickMassResetCommand(),
        new ModerationNickMassSetCommand(),
      ],
    });
  }
}
