import { I18n } from '../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../basecommand';

import { GameImagineCommand } from '../game/imagine';


// the games still being tested, they move into `/game` once they're public
export class OwnerGameGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Games to play with everyone in the channel';
  descriptionLocalizations = I18n.localizations('commands.game.description');
  name = 'game';
  nameLocalizations = I18n.localizations('commands.game.name');

  constructor() {
    super({
      options: [
        new GameImagineCommand(),
      ],
    });
  }
}
