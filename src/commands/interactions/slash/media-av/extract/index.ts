import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVExtractAudioCommand } from './audio';


export class MediaAVExtractGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'extract';

  constructor() {
	super({
	  options: [
		new MediaAVExtractAudioCommand(),
	  ],
	});
  }
}
