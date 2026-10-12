import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'textwall';

export class TextwallCommand extends BaseInteractionCommandOption {
  description = 'Textwallify some text';
  descriptionLocalizations = I18n.localizations('commands.fun.textwall.description');
  metadata = {
    id: Formatter.Commands.FunTextwall.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.textwall.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to textwallify',
          ...I18n.optionLocalizations('commands.fun.textwall.text'),
          value: Parameters.targetTextWithParsedMentions,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunTextwall.CommandArgs) {
    return Formatter.Commands.FunTextwall.createMessage(context, args);
  }
}
