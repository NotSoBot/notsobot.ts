import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsMathCommand extends BaseInteractionCommandOption {
  description = 'Solve a math expression';
  descriptionLocalizations = I18n.localizations('commands.tools.math.description');
  metadata = {
    id: Formatter.Commands.ToolsMath.COMMAND_ID,
  };
  name = 'math';
  nameLocalizations = I18n.localizations('commands.tools.math.name');

  constructor() {
    super({
      options: [
        {
          name: 'equation',
          description: 'Math Equation',
          ...I18n.optionLocalizations('commands.tools.math.equation'),
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsMath.CommandArgs) {
    return Formatter.Commands.ToolsMath.createMessage(context, args);
  }
}
