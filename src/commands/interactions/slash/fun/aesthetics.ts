import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'aesthetics';

export class AestheticsCommand extends BaseInteractionCommandOption {
  description = 'Aestheticfy some text';
  descriptionLocalizations = I18n.localizations('commands.fun.aesthetics.description');
  metadata = {
    id: Formatter.Commands.FunAesthetics.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.aesthetics.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to aestheticfy',
          ...I18n.optionLocalizations('commands.fun.aesthetics.text'),
          value: Parameters.targetText,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAesthetics.CommandArgs) {
    return Formatter.Commands.FunAesthetics.createMessage(context, args);
  }
}
