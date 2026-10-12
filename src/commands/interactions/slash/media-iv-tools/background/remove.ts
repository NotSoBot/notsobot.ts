import { Interaction } from 'detritus-client';

import { MediaBackgroundRemovalModels, MediaBackgroundRemovalModelsToText } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class MediaIVToolsBackgroundRemoveCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Remove an Image or Video\'s background';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.background.remove.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBackgroundRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.background.remove.name');

  constructor() {
    super({
      options: [
        {
          name: 'model',
          description: 'Background Removal Model',
          ...I18n.optionLocalizations('commands.media_iv_tools.background.remove.model'),
          choices: Parameters.Slash.oneOf({
            choices: MediaBackgroundRemovalModels,
            defaultChoice: Formatter.Commands.MediaIVManipulationBackgroundRemove.DEFAULT_MODEL,
            descriptions: MediaBackgroundRemovalModelsToText,
          }),
          default: Formatter.Commands.MediaIVManipulationBackgroundRemove.DEFAULT_MODEL,
        },
        {
          name: 'trim',
          description: 'Trim Excess Background',
          ...I18n.optionLocalizations('commands.media_iv_tools.background.remove.trim'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBackgroundRemove.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBackgroundRemove.createMessage(context, args);
  }
}
