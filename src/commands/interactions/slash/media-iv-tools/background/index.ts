import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVToolsBackgroundRemoveCommand } from './remove';


export class MediaIVToolsBackgroundGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Edit an image or video\'s background';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.background.description');
  name = 'background';
  nameLocalizations = I18n.localizations('commands.media_iv_tools.background.name');

  constructor() {
    super({
      options: [
        new MediaIVToolsBackgroundRemoveCommand(),
      ],
    });
  }
}
