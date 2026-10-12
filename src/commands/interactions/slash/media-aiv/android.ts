import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'android';

export class MediaAIVAndroidCommand extends BaseInteractionMediaCommandOption {
  description = 'Compress the Audio/Image/Video File to be Android-Like';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.android.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationAndroid.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Compression Scale (Default: 10)', ...I18n.optionLocalizations('commands.media_aiv.android.scale'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationAndroid.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAndroid.createMessage(context, args);
  }
}
