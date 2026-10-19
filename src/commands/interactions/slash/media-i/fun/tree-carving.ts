import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'tree-carving';

export class MediaITreeCarvingCommand extends BaseInteractionCommandOption {
  description = 'Carve text into a tree';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.tree_carving.description');
  metadata = {
    id: Formatter.Commands.MediaICreateTreeCarving.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.tree_carving.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.tree_carving.text'),
          maxLength: Formatter.Commands.MediaICreateTreeCarving.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateTreeCarving.MAX_TEXT_LENGTH}),
        },
        {
          name: 'text-2',
          description: 'Second line (optional)',
          ...I18n.optionLocalizations('commands.media_i.fun.tree_carving.text_2'),
          label: 'text2',
          maxLength: Formatter.Commands.MediaICreateTreeCarving.MAX_TEXT_2_LENGTH,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateTreeCarving.MAX_TEXT_2_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateTreeCarving.CommandArgs) {
    return Formatter.Commands.MediaICreateTreeCarving.createMessage(context, args);
  }
}
