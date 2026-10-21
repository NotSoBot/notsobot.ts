import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVAlienCommand } from './alien';
import { MediaIVAngryCommand } from './angry';
import { MediaIVAnimeCommand } from './anime';
import { MediaIVClownCommand } from './clown';
import { MediaIVDrawFacesCommand } from './draw-faces';
import { MediaIVFaceSwapCommand } from './swap';
import { MediaIVFatCommand } from './fat';
import { MediaIVGrumpyCommand } from './grumpy';
import { MediaIVHalloweenHatCommand } from './halloween-hat';
import { MediaIVJoyCommand } from './joy';
import { MediaIVKirkCommand } from './kirk';
import { MediaIVKnightCommand } from './knight';
import { MediaIVLeninCommand } from './lenin';
import { MediaIVMimicCommand } from './mimic';
import { MediaIVMonaLisaCommand } from './mona-lisa';
import { MediaIVMountRushmoreCommand } from './mount-rushmore';
import { MediaIVSadCommand } from './sad';
import { MediaIVSmileCommand } from './smile';
import { MediaIVSmugCommand } from './smug';
import { MediaIVSurprisedCommand } from './surprised';
import { MediaIVXmasCapCommand } from './xmas-cap';


export default class MediaIVFaceGroupCommand extends BaseSlashCommand {
  description = 'Edit the faces in an image or video: swap, moods, hats and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_face.description');
  name = 'media-iv-face';

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
        new MediaIVAlienCommand(),
        new MediaIVAngryCommand(),
        new MediaIVAnimeCommand(),
        new MediaIVClownCommand(),
        new MediaIVDrawFacesCommand(),
        new MediaIVFatCommand(),
        new MediaIVGrumpyCommand(),
        new MediaIVHalloweenHatCommand(),
        new MediaIVJoyCommand(),
        new MediaIVKirkCommand(),
        new MediaIVKnightCommand(),
        new MediaIVLeninCommand(),
        new MediaIVMimicCommand(),
        new MediaIVMonaLisaCommand(),
        new MediaIVMountRushmoreCommand(),
        new MediaIVSadCommand(),
        new MediaIVSmileCommand(),
        new MediaIVSmugCommand(),
        new MediaIVSurprisedCommand(),
        new MediaIVFaceSwapCommand(),
        new MediaIVXmasCapCommand(),
      ],
    });
  }
}
