import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAVAudioBitcrushCommand } from './bitcrush';
import { MediaAVAudioBoostBassCommand } from './boost-bass';
import { MediaAVAudioChorusCommand } from './chorus';
import { MediaAVAudioCompressCommand } from './compress';
import { MediaAVAudioDestroyCommand } from './destroy';
import { MediaAVAudioDistortionCommand } from './distortion';
import { MediaAVAudioEqualizerCommand } from './equalizer';
import { MediaAVAudioFlangerCommand } from './flanger';
import { MediaAVAudioGapperCommand } from './gapper';
import { MediaAVAudioNormalizeCommand } from './normalize';
import { MediaAVAudioPaulstretchCommand } from './paulstretch';
import { MediaAVAudioPingPongCommand } from './ping-pong';
import { MediaAVAudioReverbCommand } from './reverb';
import { MediaAVAudioReverseCommand } from './reverse';
import { MediaAVAudioSentenceMixCommand } from './sentence-mix';
import { MediaAVStammerCommand } from './stammer';
import { MediaAVAudioTremoloCommand } from './tremolo';
import { MediaAVAudioVibratoCommand } from './vibrato';
import { MediaAVAudioWahWahCommand } from './wah-wah';


export default class MediaAVEffectGroupCommand extends BaseSlashCommand {
  description = 'Audio effects: bass boost, reverb, bitcrush, equalizer and more';
  descriptionLocalizations = I18n.localizations('commands.media_av_effect.description');
  name = 'media-av-effect';

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
        new MediaAVAudioBitcrushCommand(),
        new MediaAVAudioBoostBassCommand(),
        new MediaAVAudioChorusCommand(),
        new MediaAVAudioCompressCommand(),
        new MediaAVAudioDestroyCommand(),
        new MediaAVAudioDistortionCommand(),
        new MediaAVAudioEqualizerCommand(),
        new MediaAVAudioFlangerCommand(),
        new MediaAVAudioGapperCommand(),
        new MediaAVAudioNormalizeCommand(),
        new MediaAVAudioPaulstretchCommand(),
        new MediaAVAudioPingPongCommand(),
        new MediaAVAudioReverbCommand(),
        new MediaAVAudioReverseCommand(),
        new MediaAVAudioSentenceMixCommand(),
        new MediaAVStammerCommand(),
        new MediaAVAudioTremoloCommand(),
        new MediaAVAudioVibratoCommand(),
        new MediaAVAudioWahWahCommand(),
      ],
    });
  }
}
