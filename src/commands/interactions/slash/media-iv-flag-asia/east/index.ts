import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagChinaCommand } from './china';
import { MediaIVFlagHongKongCommand } from './hongkong';
import { MediaIVFlagJapanCommand } from './japan';
import { MediaIVFlagMacauCommand } from './macau';
import { MediaIVFlagMongoliaCommand } from './mongolia';
import { MediaIVOverlayNorthKoreaCommand } from './northkorea';
import { MediaIVFlagSouthKoreaCommand } from './southkorea';
import { MediaIVFlagTaiwanCommand } from './taiwan';


export class MediaIVFlagAsiaEastGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'East Asian Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.east.description');
  name = 'east';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_asia.east.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagChinaCommand(),
        new MediaIVFlagHongKongCommand(),
        new MediaIVFlagJapanCommand(),
        new MediaIVFlagMacauCommand(),
        new MediaIVFlagMongoliaCommand(),
        new MediaIVOverlayNorthKoreaCommand(),
        new MediaIVFlagSouthKoreaCommand(),
        new MediaIVFlagTaiwanCommand(),
      ],
    });
  }
}
