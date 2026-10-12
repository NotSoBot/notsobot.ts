import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'deepfry';

export class MediaIVDeepfryCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Deepfry an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.fun.deepfry.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDeepfry.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'notransparency', description: 'Do not keep transparency', ...I18n.optionLocalizations('commands.media_iv.fun.deepfry.notransparency'), type: Boolean},
        {name: 'scale', description: 'Deepfry Scale (Default: 10.0)', ...I18n.optionLocalizations('commands.media_iv.fun.deepfry.scale'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDeepfry.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDeepfry.createMessage(context, args);
  }
}
