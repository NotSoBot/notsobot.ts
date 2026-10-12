import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class MediaIVConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Image or Video File';
  descriptionLocalizations = I18n.localizations('commands.media_iv.convert.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.IV.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.convert.name');

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          ...I18n.optionLocalizations('commands.media_iv.convert.to'),
          choices: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.IV.SLASH_CHOICES,
        },
        {
          name: 'noaudio',
          description: 'Remove Audio',
          ...I18n.optionLocalizations('commands.media_iv.convert.noaudio'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConvert.createMessage(context, args);
  }
}
