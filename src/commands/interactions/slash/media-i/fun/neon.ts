import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'neon';

export class MediaINeonCommand extends BaseInteractionCommandOption {
  description = 'Write text as a neon sign';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.neon.description');
  metadata = {
    id: Formatter.Commands.MediaICreateNeon.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.neon.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.neon.text'),
          maxLength: Formatter.Commands.MediaICreateNeon.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateNeon.MAX_TEXT_LENGTH}),
        },
        {
          name: 'text-2',
          description: 'Second line (optional)',
          ...I18n.optionLocalizations('commands.media_i.fun.neon.text_2'),
          label: 'text2',
          maxLength: Formatter.Commands.MediaICreateNeon.MAX_TEXT_2_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateNeon.MAX_TEXT_2_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateNeon.CommandArgs) {
    return Formatter.Commands.MediaICreateNeon.createMessage(context, args);
  }
}
