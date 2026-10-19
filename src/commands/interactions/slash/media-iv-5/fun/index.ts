import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVArtisticCommand } from './artistic';
import { MediaIVBillCommand } from './bill';
import { MediaIVBurnCommand } from './burn';
import { MediaIVGlassCommand } from './glass';
import { MediaIVInstantCameraCommand } from './instant-camera';
import { MediaIVLatteCommand } from './latte';
import { MediaIVLUTCommand } from './lut';
import { MediaIVMuseumCommand } from './museum';
import { MediaIVOldTVCommand } from './old-tv';
import { MediaIVPopArtCommand } from './pop-art';
import { MediaIVSpheresCommand } from './spheres';
import { MediaIVTimesquareCommand } from './times-square';
import { MediaIVTunnelCommand } from './tunnel';
import { MediaIVTVSimulatorCommand } from './tv-simulator';
import { MediaIVUniverseCommand } from './universe';
import { MediaIVVHSCommand } from './vhs';


// overflow for the /media-iv, /media-iv-2 and /media-iv-3 `fun` groups, which are all at discord's 25 subcommand limit
// (tunnel was never registered because of that)
export class MediaFun5GroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.name');

  constructor() {
    super({
      options: [
        new MediaIVArtisticCommand(),
        new MediaIVBillCommand(),
        new MediaIVBurnCommand(),
        new MediaIVGlassCommand(),
        new MediaIVInstantCameraCommand(),
        new MediaIVLatteCommand(),
        new MediaIVLUTCommand(),
        new MediaIVMuseumCommand(),
        new MediaIVOldTVCommand(),
        new MediaIVPopArtCommand(),
        new MediaIVSpheresCommand(),
        new MediaIVTimesquareCommand(),
        new MediaIVTunnelCommand(),
        new MediaIVTVSimulatorCommand(),
        new MediaIVUniverseCommand(),
        new MediaIVVHSCommand(),
      ],
    });
  }
}
