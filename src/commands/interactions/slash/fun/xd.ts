import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'xd';

export class XDCommand extends BaseInteractionCommandOption {
  description = 'Draw a big XD out of up to 3 words';
  descriptionLocalizations = I18n.localizations('commands.fun.xd.description');
  metadata = {
    id: Formatter.Commands.FunXD.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.xd.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Up to 3 words, 10 characters each',
          ...I18n.optionLocalizations('commands.fun.xd.text'),
          value: Parameters.targetTextWithParsedMentions,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunXD.CommandArgs) {
    return Formatter.Commands.FunXD.createMessage(context, args);
  }
}
