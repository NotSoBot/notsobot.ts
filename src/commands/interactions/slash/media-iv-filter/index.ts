import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVArtisticCommand } from './artistic';
import { MediaIVAsciiCommand } from './ascii';
import { MediaIVBlurCommand } from './blur';
import { MediaIVCartoonCommand } from './cartoon';
import { MediaIVCharcoalCommand } from './charcoal';
import { MediaIVCharcoalGifCommand } from './charcoal-gif';
import { MediaIVCircleCommand } from './circle';
import { MediaIVEdgeDetectCommand } from './edge-detect';
import { MediaIVEmbossCommand } from './emboss';
import { MediaIVGlowCommand } from './glow';
import { MediaIVHiddenCommand } from './hidden';
import { MediaIVLegofyCommand } from './legofy';
import { MediaIVMotionBlurCommand } from './motion-blur';
import { MediaIVPaintCommand } from './paint';
import { MediaIVPaintGifCommand } from './paint-gif';
import { MediaIVPhoSimpCommand } from './phosimp';
import { MediaIVPopArtCommand } from './pop-art';
import { MediaIVQuadartCommand } from './quadart';
import { MediaIVSharpenCommand } from './sharpen';
import { MediaIVTraceCommand } from './trace';
import { MediaIVWatercolorCommand } from './watercolor';
import { MediaIVXytCommand } from './xyt';
import { MediaIVZoomBlurCommand } from './zoom-blur';


export default class MediaIVFilterGroupCommand extends BaseSlashCommand {
  description = 'Art filters and blurs: paint, cartoon, ASCII and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_filter.description');
  name = 'media-iv-filter';

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
        new MediaIVArtisticCommand(),
        new MediaIVAsciiCommand(),
        new MediaIVBlurCommand(),
        new MediaIVCartoonCommand(),
        new MediaIVCharcoalCommand(),
        new MediaIVCharcoalGifCommand(),
        new MediaIVCircleCommand(),
        new MediaIVEdgeDetectCommand(),
        new MediaIVEmbossCommand(),
        new MediaIVGlowCommand(),
        new MediaIVHiddenCommand(),
        new MediaIVLegofyCommand(),
        new MediaIVMotionBlurCommand(),
        new MediaIVPaintCommand(),
        new MediaIVPaintGifCommand(),
        new MediaIVPhoSimpCommand(),
        new MediaIVPopArtCommand(),
        new MediaIVQuadartCommand(),
        new MediaIVSharpenCommand(),
        new MediaIVTraceCommand(),
        new MediaIVWatercolorCommand(),
        new MediaIVXytCommand(),
        new MediaIVZoomBlurCommand(),
      ],
    });
  }
}
