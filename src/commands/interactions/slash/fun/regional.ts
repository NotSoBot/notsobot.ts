import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'regional';

export class RegionalCommand extends BaseInteractionCommandOption {
  description = 'Convert text to regional emojis';
  descriptionLocalizations = I18n.localizations('commands.fun.regional.description');
  metadata = {
    id: Formatter.Commands.FunRegional.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.regional.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to convert',
          ...I18n.optionLocalizations('commands.fun.regional.text'),
          value: Parameters.targetText,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunRegional.CommandArgs) {
    return Formatter.Commands.FunRegional.createMessage(context, args);
  }
}
