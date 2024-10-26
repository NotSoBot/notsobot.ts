import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVAudioChannelsCombineCommand } from './channels-combine';
import { MediaAVAudioCompressCommand } from './compress';
import { MediaAVAudioDestroyCommand } from './destroy';
import { MediaAVExtractAudioCommand } from './extract';
import { MediaAVToolsIdentifyCommand } from './identify';
import { MediaAVAudioPitchCommand } from './pitch';
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
          new MediaAVAudioDestroyCommand(),
          new MediaAVExtractAudioCommand(),
          new MediaAVToolsIdentifyCommand(),
          new MediaAVAudioPitchCommand(),
          new MediaAVAudioVibratoCommand(),
          new MediaAVVolumeCommand(),
	    ],
	  });
  }
}
