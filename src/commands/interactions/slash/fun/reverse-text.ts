import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reverse-text';

export class ReverseTextCommand extends BaseInteractionCommandOption {
  description = 'Reverse text';
  descriptionLocalizations = I18n.localizations('commands.fun.reverse_text.description');
  metadata = {
    id: Formatter.Commands.FunReverseText.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.reverse_text.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to reverse',
          ...I18n.optionLocalizations('commands.fun.reverse_text.text'),
          value: Parameters.targetText,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunReverseText.CommandArgs) {
    return Formatter.Commands.FunReverseText.createMessage(context, args);
  }
}
