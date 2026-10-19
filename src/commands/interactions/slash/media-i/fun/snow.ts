import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'snow';

export class MediaISnowWritingCommand extends BaseInteractionCommandOption {
  description = 'Write text in the snow';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.snow.description');
  metadata = {
    id: Formatter.Commands.MediaICreateSnowWriting.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.snow.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.snow.text'),
          maxLength: Formatter.Commands.MediaICreateSnowWriting.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateSnowWriting.MAX_TEXT_LENGTH}),
        },
        {
          name: 'text-2',
          description: 'Second line (optional)',
          ...I18n.optionLocalizations('commands.media_i.fun.snow.text_2'),
          label: 'text2',
          maxLength: Formatter.Commands.MediaICreateSnowWriting.MAX_TEXT_2_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateSnowWriting.MAX_TEXT_2_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateSnowWriting.CommandArgs) {
    return Formatter.Commands.MediaICreateSnowWriting.createMessage(context, args);
  }
}
