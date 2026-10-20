import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'agarify';

export class AgarifyCommand extends BaseInteractionCommandOption {
  description = 'Turn text into an agar.io style name with a clan tag (Default: your name)';
  descriptionLocalizations = I18n.localizations('commands.fun.agarify.description');
  metadata = {
    id: Formatter.Commands.FunAgarify.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.agarify.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to agarify',
          ...I18n.optionLocalizations('commands.fun.agarify.text'),
          value: Parameters.targetTextWithParsedMentions,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAgarify.CommandArgs) {
    return Formatter.Commands.FunAgarify.createMessage(context, args);
  }
}
