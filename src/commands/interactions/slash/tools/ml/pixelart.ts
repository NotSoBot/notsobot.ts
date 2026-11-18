import { Interaction } from 'detritus-client';

import { CommandRatelimits } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ToolsMLPixelartCommand extends BaseInteractionCommandOption {
  description = 'Make 16x16 pixel art sprites from a prompt';
  descriptionLocalizations = I18n.localizations('commands.tools.ml.pixelart.description');
  metadata = {
    credits: Formatter.Commands.ToolsMLPixelart.CREDITS,
    id: Formatter.Commands.ToolsMLPixelart.COMMAND_ID,
  };
  name = 'pixelart';
  nameLocalizations = I18n.localizations('commands.tools.ml.pixelart.name');

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'What to draw',
          ...I18n.optionLocalizations('commands.tools.ml.pixelart.query'),
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {name: 'seed', type: Number, description: 'Initial Noise', ...I18n.optionLocalizations('commands.tools.ml.pixelart.seed')},
      ],
      ratelimits: CommandRatelimits.ML_IMAGE,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMLPixelart.CommandArgs) {
    return Formatter.Commands.ToolsMLPixelart.createMessage(context, args);
  }
}
