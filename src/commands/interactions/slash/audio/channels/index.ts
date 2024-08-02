import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVManipulationAudioChannelsCombineCommand } from './combine';


export class MediaAVManipulationAudioChannelsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'channels';

  constructor() {
	super({
	  options: [
		new MediaAVManipulationAudioChannelsCombineCommand(),
	  ],
	});
  }
}
