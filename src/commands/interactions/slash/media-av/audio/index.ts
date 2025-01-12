import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVAudioChannelsCombineCommand } from './channels-combine';
import { MediaAVAudioCompressCommand } from './compress';
import { MediaAVAudioDelayCommand } from './delay';
import { MediaAVAudioDestroyCommand } from './destroy';
import { MediaAVToolsIdentifyCommand } from './identify';
import { MediaAVAudioPitchCommand } from './pitch';
import { MediaAVAudioTremoloCommand } from './tremolo';
import { MediaAVAudioVibratoCommand } from './vibrato';
import { MediaAVVolumeCommand } from './volume';


export class MediaAVAudioGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'audio';

  constructor() {
	  super({
	    options: [
          new MediaAVAudioChannelsCombineCommand(),
          new MediaAVAudioCompressCommand(),
          new MediaAVAudioDelayCommand(),
          new MediaAVAudioDestroyCommand(),
          new MediaAVToolsIdentifyCommand(),
          new MediaAVAudioPitchCommand(),
          new MediaAVAudioTremoloCommand(),
          new MediaAVAudioVibratoCommand(),
          new MediaAVVolumeCommand(),
	    ],
	  });
  }
}
