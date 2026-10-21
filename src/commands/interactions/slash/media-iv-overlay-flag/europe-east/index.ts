import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagArmeniaCommand } from './armenia';
import { MediaIVFlagAzerbaijanCommand } from './azerbaijan';
import { MediaIVFlagBelarusCommand } from './belarus';
import { MediaIVFlagBulgariaCommand } from './bulgaria';
import { MediaIVFlagCzechiaCommand } from './czechia';
import { MediaIVFlagEstoniaCommand } from './estonia';
import { MediaIVFlagGeorgiaCommand } from './georgia';
import { MediaIVFlagHungaryCommand } from './hungary';
import { MediaIVFlagKazakhstanCommand } from './kazakhstan';
import { MediaIVFlagLatviaCommand } from './latvia';
import { MediaIVFlagLithuaniaCommand } from './lithuania';
import { MediaIVFlagMoldovaCommand } from './moldova';
import { MediaIVFlagPolandCommand } from './poland';
import { MediaIVFlagRomaniaCommand } from './romania';
import { MediaIVOverlayRussiaCommand } from './russia';
import { MediaIVFlagSlovakiaCommand } from './slovakia';
import { MediaIVFlagUkraineCommand } from './ukraine';
import { MediaIVOverlayUSSRCommand } from './ussr';


export class MediaIVOverlayFlagEuropeEastGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Eastern European Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay_flag.europe_east.description');
  name = 'europe-east';
  nameLocalizations = I18n.localizations('commands.media_iv_overlay_flag.europe_east.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagArmeniaCommand(),
        new MediaIVFlagAzerbaijanCommand(),
        new MediaIVFlagBelarusCommand(),
        new MediaIVFlagBulgariaCommand(),
        new MediaIVFlagCzechiaCommand(),
        new MediaIVFlagEstoniaCommand(),
        new MediaIVFlagGeorgiaCommand(),
        new MediaIVFlagHungaryCommand(),
        new MediaIVFlagKazakhstanCommand(),
        new MediaIVFlagLatviaCommand(),
        new MediaIVFlagLithuaniaCommand(),
        new MediaIVFlagMoldovaCommand(),
        new MediaIVFlagPolandCommand(),
        new MediaIVFlagRomaniaCommand(),
        new MediaIVOverlayRussiaCommand(),
        new MediaIVFlagSlovakiaCommand(),
        new MediaIVFlagUkraineCommand(),
        new MediaIVOverlayUSSRCommand(),
      ],
    });
  }
}
