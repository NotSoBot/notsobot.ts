import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVToolsColorRemoveCommand } from './remove';


export class MediaIVToolsColorGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Edit an image or video\'s colors';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.color.description');
  name = 'color';
  nameLocalizations = I18n.localizations('commands.media_iv_tools.color.name');

  constructor() {
    super({
      options: [
        new MediaIVToolsColorRemoveCommand(),
      ],
    });
  }
}
