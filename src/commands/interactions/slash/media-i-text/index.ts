import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIEinsteinCommand } from './einstein';
import { MediaIFoggyWindowCommand } from './foggy-window';
import { MediaIHackerCommand } from './hacker';
import { MediaINeonCommand } from './neon';
import { MediaIPresidentialCommand } from './presidential';
import { MediaIRealfactCommand } from './realfact';
import { MediaIRetroCommand } from './retro';
import { MediaIRipCommand } from './rip';
import { MediaISnowWritingCommand } from './snow';
import { MediaISonicCommand } from './sonic';
import { MediaISoupCommand } from './soup';
import { MediaIThonkifyCommand } from './thonkify';
import { MediaITreeCarvingCommand } from './tree-carving';
import { MediaIWoodenSignCommand } from './wooden-sign';
import { MediaIWordcloudCommand } from './wordcloud';
import { MediaIYachtCommand } from './yacht';


export default class MediaITextGroupCommand extends BaseSlashCommand {
  description = 'Make images from your text: signs, neon, tombstones and more';
  descriptionLocalizations = I18n.localizations('commands.media_i_text.description');
  name = 'media-i-text';

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
        new MediaIEinsteinCommand(),
        new MediaIFoggyWindowCommand(),
        new MediaIHackerCommand(),
        new MediaINeonCommand(),
        new MediaIPresidentialCommand(),
        new MediaIRealfactCommand(),
        new MediaIRetroCommand(),
        new MediaIRipCommand(),
        new MediaISnowWritingCommand(),
        new MediaISonicCommand(),
        new MediaISoupCommand(),
        new MediaIThonkifyCommand(),
        new MediaITreeCarvingCommand(),
        new MediaIWoodenSignCommand(),
        new MediaIWordcloudCommand(),
        new MediaIYachtCommand(),
      ],
    });
  }
}
