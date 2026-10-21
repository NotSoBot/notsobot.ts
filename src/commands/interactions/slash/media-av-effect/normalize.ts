import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'normalize';

export class MediaAVAudioNormalizeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Normalize the loudness of an Audio or Video to a high volume';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.normalize.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioNormalize.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.normalize.name');

  constructor() {
    super({
      options: [
        {name: 'strength', description: 'How loud it gets, 0 to 1 (Default: 1)', ...I18n.optionLocalizations('commands.media_av.audio.normalize.strength'), type: 'number', minValue: 0, maxValue: 1},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioNormalize.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioNormalize.createMessage(context, args);
  }
}
