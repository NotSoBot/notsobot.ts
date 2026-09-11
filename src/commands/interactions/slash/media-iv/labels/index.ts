import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVLabelsIFunnyCommand } from './ifunny';


export class MediaIVLabelsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'labels';

  constructor() {
    super({
      options: [
        new MediaIVLabelsIFunnyCommand(),
      ],
    });
  }
}
