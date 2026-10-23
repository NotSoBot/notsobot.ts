import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class MediaAIVConvertCommand extends BaseInteractionMediaCommandOption {
  description = 'Convert an Audio, Image or Video File';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.convert.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationConvert.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv_tools.convert.name');

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          ...I18n.optionLocalizations('commands.media_aiv_tools.convert.to'),
          choices: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.AIV.SLASH_CHOICES,
        },
        {
          name: 'noaudio',
          description: 'Remove Audio',
          ...I18n.optionLocalizations('commands.media_aiv_tools.convert.noaudio'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConvert.createMessage(context, args);
  }
}
