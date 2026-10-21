import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlagArmeniaCommand } from './armenia';
import { MediaIVFlagAzerbaijanCommand } from './azerbaijan';
import { MediaIVFlagChinaCommand } from './china';
import { MediaIVFlagCyprusCommand } from './cyprus';
import { MediaIVFlagGeorgiaCommand } from './georgia';
import { MediaIVFlagIndiaCommand } from './india';
import { MediaIVFlagIranCommand } from './iran';
import { MediaIVOverlayIsraelCommand } from './israel';
import { MediaIVFlagJapanCommand } from './japan';
import { MediaIVFlagKazakhstanCommand } from './kazakhstan';
import { MediaIVOverlayNorthKoreaCommand } from './northkorea';
import { MediaIVFlagPalestineCommand } from './palestine';
import { MediaIVFlagSyriaCommand } from './syria';
import { MediaIVFlagTurkeyCommand } from './turkey';


export default class MediaIVFlagAsiaGroupCommand extends BaseSlashCommand {
  description = 'Put Asian flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.description');
  name = 'media-iv-flag-asia';

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
        new MediaIVFlagArmeniaCommand(),
        new MediaIVFlagAzerbaijanCommand(),
        new MediaIVFlagChinaCommand(),
        new MediaIVFlagCyprusCommand(),
        new MediaIVFlagGeorgiaCommand(),
        new MediaIVFlagIndiaCommand(),
        new MediaIVFlagIranCommand(),
        new MediaIVOverlayIsraelCommand(),
        new MediaIVFlagJapanCommand(),
        new MediaIVFlagKazakhstanCommand(),
        new MediaIVOverlayNorthKoreaCommand(),
        new MediaIVFlagPalestineCommand(),
        new MediaIVFlagSyriaCommand(),
        new MediaIVFlagTurkeyCommand(),
      ],
    });
  }
}
