import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'agar';

export class AgarCommand extends BaseInteractionCommandOption {
  description = 'Turn text into an agar.io style name (Default: your name)';
  descriptionLocalizations = I18n.localizations('commands.fun.agar.description');
  metadata = {
    id: Formatter.Commands.FunAgar.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.agar.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to agarify',
          ...I18n.optionLocalizations('commands.fun.agar.text'),
          value: Parameters.targetTextWithParsedMentions,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAgar.CommandArgs) {
    return Formatter.Commands.FunAgar.createMessage(context, args);
  }
}
