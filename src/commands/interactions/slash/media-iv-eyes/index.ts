import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVEyesBigCommand } from './big';
import { MediaIVEyesBlackCommand } from './black';
import { MediaIVEyesBloodshotCommand } from './bloodshot';
import { MediaIVEyesBlueCommand } from './blue';
import { MediaIVEyesCenterCommand } from './center';
import { MediaIVEyesDefaultCommand } from './default';
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


export default class MediaIVEyesGroupCommand extends BaseSlashCommand {
  description = 'Put eyes on the faces in an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_eyes.description');
  name = 'media-iv-eyes';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      permissions: [Permissions.ATTACH_FILES],
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
