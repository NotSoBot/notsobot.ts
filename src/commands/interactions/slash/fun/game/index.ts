import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { FunGameImagineCommand } from './imagine';


export class FunGameGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Games to play with everyone in the channel';
  descriptionLocalizations = I18n.localizations('commands.fun.game.description');
  name = 'game';
  nameLocalizations = I18n.localizations('commands.fun.game.name');

  constructor() {
    super({
      options: [
        new FunGameImagineCommand(),
      ],
    });
  }
}
