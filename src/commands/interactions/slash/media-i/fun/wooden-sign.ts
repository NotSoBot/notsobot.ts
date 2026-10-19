import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wooden-sign';

export class MediaIWoodenSignCommand extends BaseInteractionCommandOption {
  description = 'Carve text into a wooden sign';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.wooden_sign.description');
  metadata = {
    id: Formatter.Commands.MediaICreateWoodenSign.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.wooden_sign.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.wooden_sign.text'),
          maxLength: Formatter.Commands.MediaICreateWoodenSign.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateWoodenSign.MAX_TEXT_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateWoodenSign.CommandArgs) {
    return Formatter.Commands.MediaICreateWoodenSign.createMessage(context, args);
  }
}
