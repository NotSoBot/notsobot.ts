import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { VideoExtractAudioCommand } from './audio';


export class VideoExtractGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'extract';

  constructor() {
    super({
      options: [
        new VideoExtractAudioCommand(),
      ],
    });
  }
}
