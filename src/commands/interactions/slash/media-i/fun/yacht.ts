import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'yacht';

export class MediaIYachtCommand extends BaseInteractionCommandOption {
  description = 'Write some text on the side of a yacht';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.yacht.description');
  metadata = {
    id: Formatter.Commands.MediaICreateYacht.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.yacht.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to put on the yacht',
          ...I18n.optionLocalizations('commands.media_i.fun.yacht.text'),
          maxLength: Formatter.Commands.MediaICreateYacht.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateYacht.MAX_TEXT_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateYacht.CommandArgs) {
    return Formatter.Commands.MediaICreateYacht.createMessage(context, args);
  }
}
