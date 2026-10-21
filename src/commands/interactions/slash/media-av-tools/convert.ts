import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'convert';

export class MediaAVConvertCommand extends BaseInteractionImageCommandOption {
  description = 'Convert an Audio or Video File';
  descriptionLocalizations = I18n.localizations('commands.media_av.convert.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.AV.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.convert.name');

  constructor() {
    super({
      options: [
        {
          name: 'to',
          description: 'Conversion Mimetype',
          ...I18n.optionLocalizations('commands.media_av.convert.to'),
          choices: Formatter.Commands.MediaAIVManipulationConvert.SLASH_PARAMETERS.AV.SLASH_CHOICES,
        },
        {
          name: 'noaudio',
          description: 'Remove Audio',
          ...I18n.optionLocalizations('commands.media_av.convert.noaudio'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConvert.createMessage(context, args);
  }
}
