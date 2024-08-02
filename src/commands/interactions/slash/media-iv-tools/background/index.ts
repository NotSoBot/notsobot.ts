import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVToolsBackgroundRemoveCommand } from './remove';


export class MediaIVToolsBackgroundGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'background';

  constructor() {
    super({
      options: [
        new MediaIVToolsBackgroundRemoveCommand(),
      ],
    });
  }
}
