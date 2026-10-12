import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { OwnerBlockGuildCommand } from './guild';
import { OwnerBlockUserCommand } from './user';


export class OwnerBlockGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Block guilds or users from the bot';
  descriptionLocalizations = I18n.localizations('commands.owner.block.description');
  name = 'block';
  nameLocalizations = I18n.localizations('commands.owner.block.name');

  constructor() {
    super({
      options: [
        new OwnerBlockGuildCommand(),
        new OwnerBlockUserCommand(),
      ],
    });
  }
}
