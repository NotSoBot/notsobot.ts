import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVMirrorBottomCommand } from './bottom';
import { MediaIVMirrorLeftCommand } from './left';
import { MediaIVMirrorRightCommand } from './right';
import { MediaIVMirrorTopCommand } from './top';


export class MediaIVMirrorGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Mirror half of an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.mirror.description');
  name = 'mirror';
  nameLocalizations = I18n.localizations('commands.media_iv_4.mirror.name');

  constructor() {
    super({
      options: [
        new MediaIVMirrorBottomCommand(),
        new MediaIVMirrorLeftCommand(),
        new MediaIVMirrorRightCommand(),
        new MediaIVMirrorTopCommand(),
      ],
    });
  }
}
