import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVEyesDefaultCommand } from './default';
import { MediaIVEyesBigCommand } from './big';
import { MediaIVEyesBlackCommand } from './black';
import { MediaIVEyesBloodshotCommand } from './bloodshot';
import { MediaIVEyesBlueCommand } from './blue';
import { MediaIVEyesCenterCommand } from './center';
import { MediaIVEyesGooglyCommand } from './googly';
import { MediaIVEyesGreenCommand } from './green';
import { MediaIVEyesHorrorCommand } from './horror';
import { MediaIVEyesIlluminatiCommand } from './illuminati';
import { MediaIVEyesMoneyCommand } from './money';
import { MediaIVEyesPinkCommand } from './pink';
import { MediaIVEyesRedCommand } from './red';
import { MediaIVEyesSmallCommand } from './small';
import { MediaIVEyesSpinnerCommand } from './spinner';
import { MediaIVEyesSpongebobCommand } from './spongebob';
import { MediaIVEyesWhiteCommand } from './white';
import { MediaIVEyesYellowCommand } from './yellow';


export class MediaIVEyesGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Attach eyes to people\'s faces';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.description');
  name = 'eyes';
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.name');

  constructor() {
    super({
      options: [
        new MediaIVEyesDefaultCommand(),
        new MediaIVEyesBigCommand(),
        new MediaIVEyesBlackCommand(),
        new MediaIVEyesBloodshotCommand(),
        new MediaIVEyesBlueCommand(),
        new MediaIVEyesCenterCommand(),
        new MediaIVEyesGooglyCommand(),
        new MediaIVEyesGreenCommand(),
        new MediaIVEyesHorrorCommand(),
        new MediaIVEyesIlluminatiCommand(),
        new MediaIVEyesMoneyCommand(),
        new MediaIVEyesPinkCommand(),
        new MediaIVEyesRedCommand(),
        new MediaIVEyesSmallCommand(),
        new MediaIVEyesSpinnerCommand(),
        new MediaIVEyesSpongebobCommand(),
        new MediaIVEyesWhiteCommand(),
        new MediaIVEyesYellowCommand(),
      ],
    });
  }
}
