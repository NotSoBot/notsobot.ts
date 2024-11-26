import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAIVExtractMediaCommand } from './media';


export class MediaAIVExtractGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'extract';

  constructor() {
    super({
      options: [
          new MediaAIVExtractMediaCommand(),
      ],
    });
  }
}
