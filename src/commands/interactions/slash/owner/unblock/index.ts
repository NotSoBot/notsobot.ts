import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { OwnerUnblockGuildCommand } from './guild';
import { OwnerUnblockUserCommand } from './user';


export class OwnerUnblockGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Unblock guilds or users from the bot';
  descriptionLocalizations = I18n.localizations('commands.owner.unblock.description');
  name = 'unblock';
  nameLocalizations = I18n.localizations('commands.owner.unblock.name');

  constructor() {
    super({
      options: [
        new OwnerUnblockGuildCommand(),
        new OwnerUnblockUserCommand(),
      ],
    });
  }
}
