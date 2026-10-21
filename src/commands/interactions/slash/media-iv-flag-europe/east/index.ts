import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBelarusCommand } from './belarus';
import { MediaIVFlagBulgariaCommand } from './bulgaria';
import { MediaIVFlagCzechiaCommand } from './czechia';
import { MediaIVFlagEstoniaCommand } from './estonia';
import { MediaIVFlagHungaryCommand } from './hungary';
import { MediaIVFlagLatviaCommand } from './latvia';
import { MediaIVFlagLithuaniaCommand } from './lithuania';
import { MediaIVFlagMoldovaCommand } from './moldova';
import { MediaIVFlagPolandCommand } from './poland';
import { MediaIVFlagRomaniaCommand } from './romania';
import { MediaIVOverlayRussiaCommand } from './russia';
import { MediaIVFlagSlovakiaCommand } from './slovakia';
import { MediaIVFlagUkraineCommand } from './ukraine';
import { MediaIVOverlayUSSRCommand } from './ussr';


export class MediaIVFlagEuropeEastGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Eastern European Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_europe.east.description');
  name = 'east';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_europe.east.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBelarusCommand(),
        new MediaIVFlagBulgariaCommand(),
        new MediaIVFlagCzechiaCommand(),
        new MediaIVFlagEstoniaCommand(),
        new MediaIVFlagHungaryCommand(),
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
