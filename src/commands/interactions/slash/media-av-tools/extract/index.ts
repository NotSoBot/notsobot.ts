import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVExtractAudioCommand } from './audio';


export class MediaAVExtractGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Pull the audio out of a file';
  descriptionLocalizations = I18n.localizations('commands.media_av.extract.description');
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
