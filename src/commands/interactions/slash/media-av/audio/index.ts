import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVAudioBoostBassCommand } from './boost-bass';
import { MediaAVAudioChannelsCombineCommand } from './channels-combine';
import { MediaAVAudioCompressCommand } from './compress';
import { MediaAVAudioDelayCommand } from './delay';
import { MediaAVAudioDestroyCommand } from './destroy';
import { MediaAVAudioEqualizerCommand } from './equalizer';
import { MediaAVAudioFlangerCommand } from './flanger';
import { MediaAVToolsIdentifyCommand } from './identify';
import { MediaAVAudioPitchCommand } from './pitch';
import { MediaAVAudioReverbCommand } from './reverb';
import { MediaAVAudioReverseCommand } from './reverse';
import { MediaAVAudioTremoloCommand } from './tremolo';
import { MediaAVAudioVibratoCommand } from './vibrato';
import { MediaAVAudioVolumeCommand } from './volume';


export class MediaAVAudioGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'audio';

  constructor() {
	  super({
	    options: [
          new MediaAVAudioBoostBassCommand(),
          new MediaAVAudioChannelsCombineCommand(),
          new MediaAVAudioCompressCommand(),
          new MediaAVAudioDelayCommand(),
          new MediaAVAudioDestroyCommand(),
          new MediaAVAudioEqualizerCommand(),
          new MediaAVAudioFlangerCommand(),
          new MediaAVToolsIdentifyCommand(),
          new MediaAVAudioPitchCommand(),
          new MediaAVAudioReverbCommand(),
          new MediaAVAudioReverseCommand(),
          new MediaAVAudioTremoloCommand(),
          new MediaAVAudioVibratoCommand(),
          new MediaAVAudioVolumeCommand(),
	    ],
	  });
  }
}
