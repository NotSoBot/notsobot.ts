import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVLabelsIFunnyCommand } from './ifunny';
import { MediaIVLabelsTriggered2Command } from './triggered-2';
import { MediaIVLabelsTriggered3Command } from './triggered-3';


export class MediaIVLabelsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'labels';
  nameLocalizations = I18n.localizations('commands.media_iv.labels.name');

  constructor() {
    super({
      options: [
        new MediaIVLabelsIFunnyCommand(),
        new MediaIVLabelsTriggered2Command(),
        new MediaIVLabelsTriggered3Command(),
      ],
    });
  }
}
