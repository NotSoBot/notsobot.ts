import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAIVExtractMediaCommand } from './media';


export class MediaAIVExtractGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Extract the audio and frames of a file';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.extract.description');
  name = 'extract';
  nameLocalizations = I18n.localizations('commands.media_aiv.extract.name');

  constructor() {
    super({
      options: [
          new MediaAIVExtractMediaCommand(),
      ],
    });
  }
}
