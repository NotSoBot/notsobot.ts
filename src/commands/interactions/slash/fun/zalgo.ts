import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'zalgo';

export class ZalgoCommand extends BaseInteractionCommandOption {
  description = 'Zalgoify some text';
  descriptionLocalizations = I18n.localizations('commands.fun.zalgo.description');
  metadata = {
    id: Formatter.Commands.FunZalgo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.zalgo.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to zalgoify',
          ...I18n.optionLocalizations('commands.fun.zalgo.text'),
          value: Parameters.targetTextWithParsedMentions,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunZalgo.CommandArgs) {
    return Formatter.Commands.FunZalgo.createMessage(context, args);
  }
}
