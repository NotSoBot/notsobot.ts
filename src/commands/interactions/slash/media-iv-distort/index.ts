import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVDetunnelCommand } from './detunnel';
import { MediaIVDiceCommand } from './dice';
import { MediaIVDistortCommand } from './distort';
import { MediaIVExplodeCommand } from './explode';
import { MediaIVExplodeGifCommand } from './explode-gif';
import { MediaIVFisheyeCommand } from './fisheye';
import { MediaIVGlobeCommand } from './globe';
import { MediaIVImplodeCommand } from './implode';
import { MediaIVImplodeGifCommand } from './implode-gif';
import { MediaIVLayerCommand } from './layer';
import { MediaIVMagikCommand } from './magik';
import { MediaIVMagikGifCommand } from './magik-gif';
import { MediaIVMandalaScopeCommand } from './mandalascope';
import { MediaIVMultiplyCommand } from './multiply';
import { MediaIVRippleCommand } from './ripple';
import { MediaIVSwirlCommand } from './swirl';
import { MediaIVTunnelCommand } from './tunnel';
import { MediaIVWallCommand } from './wall';
import { MediaIVWaveCommand } from './wave';
import { MediaIVWavesCommand } from './waves';
import { MediaIVWiggleCommand } from './wiggle';
import { MediaIVZoomCommand } from './zoom';


export default class MediaIVDistortGroupCommand extends BaseSlashCommand {
  description = 'Warp an image or video: swirl, wave, fisheye and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_distort.description');
  name = 'media-iv-distort';

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
        new MediaIVDetunnelCommand(),
        new MediaIVDiceCommand(),
        new MediaIVDistortCommand(),
        new MediaIVExplodeCommand(),
        new MediaIVExplodeGifCommand(),
        new MediaIVFisheyeCommand(),
        new MediaIVGlobeCommand(),
        new MediaIVImplodeCommand(),
        new MediaIVImplodeGifCommand(),
        new MediaIVLayerCommand(),
        new MediaIVMagikCommand(),
        new MediaIVMagikGifCommand(),
        new MediaIVMandalaScopeCommand(),
        new MediaIVMultiplyCommand(),
        new MediaIVRippleCommand(),
        new MediaIVSwirlCommand(),
        new MediaIVTunnelCommand(),
        new MediaIVWallCommand(),
        new MediaIVWaveCommand(),
        new MediaIVWavesCommand(),
        new MediaIVWiggleCommand(),
        new MediaIVZoomCommand(),
      ],
    });
  }
}
