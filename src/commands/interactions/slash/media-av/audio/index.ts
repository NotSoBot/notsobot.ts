import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVAudioBitcrushCommand } from './bitcrush';
import { MediaAVAudioBoostBassCommand } from './boost-bass';
import { MediaAVAudioChannelsCombineCommand } from './channels-combine';
import { MediaAVAudioChannelsInvertCommand } from './channels-invert';
import { MediaAVAudioCompressCommand } from './compress';
import { MediaAVAudioDelayCommand } from './delay';
import { MediaAVAudioDestroyCommand } from './destroy';
import { MediaAVAudioEqualizerCommand } from './equalizer';
import { MediaAVAudioFlangerCommand } from './flanger';
import { MediaAVToolsIdentifyCommand } from './identify';
import { MediaAVAudioMultiPitchCommand } from './multipitch';
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
          new MediaAVAudioBitcrushCommand(),
          new MediaAVAudioBoostBassCommand(),
          new MediaAVAudioChannelsCombineCommand(),
          new MediaAVAudioChannelsInvertCommand(),
          new MediaAVAudioCompressCommand(),
          new MediaAVAudioDelayCommand(),
          new MediaAVAudioDestroyCommand(),
          new MediaAVAudioEqualizerCommand(),
          new MediaAVAudioFlangerCommand(),
          new MediaAVToolsIdentifyCommand(),
          new MediaAVAudioMultiPitchCommand(),
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
