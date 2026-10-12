import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVExtractAudioCommand } from './audio';


export class MediaAVExtractGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'extract';
  nameLocalizations = I18n.localizations('commands.media_av.extract.name');

  constructor() {
    super({
      options: [
          new MediaAVExtractAudioCommand(),
      ],
    });
  }
}
