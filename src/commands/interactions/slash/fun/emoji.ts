import { Interaction } from 'detritus-client';

import { EmojiTypes } from '../../../../constants';
import { Formatter, I18n, Parameters, toTitleCase } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'emoji';

export class EmojiCommand extends BaseInteractionCommandOption {
  description = 'Make an Emoji Big!';
  descriptionLocalizations = I18n.localizations('commands.fun.emoji.description');
  metadata = {
    id: Formatter.Commands.FunEmoji.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'emojis',
          description: 'Max 10 Emojis Allowed',
          ...I18n.optionLocalizations('commands.fun.emoji.emojis'),
          required: true,
        },
        {
          name: 'type',
          description: 'Emoji Platform Type',
          ...I18n.optionLocalizations('commands.fun.emoji.type'),
          choices: Formatter.Commands.FunEmoji.SLASH_CHOICES,
          default: Formatter.Commands.FunEmoji.DEFAULT_EMOJI_TYPE,
        },
        {
          name: 'size',
          description: `Emoji Size (Default: 512)`,
          ...I18n.optionLocalizations('commands.fun.emoji.size'),
          maxValue: 2048,
          minValue: 8,
          type: Number,
          default: 512,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunEmoji.CommandArgs) {
    return Formatter.Commands.FunEmoji.createMessage(context, args);
  }
}
