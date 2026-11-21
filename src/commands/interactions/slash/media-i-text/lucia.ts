import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'lucia';

export class MediaILuciaCommand extends BaseInteractionCommandOption {
  description = 'Make a "Play with Lucia" prompt asking for your text';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.lucia.description');
  metadata = {
    id: Formatter.Commands.MediaICreateLucia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.lucia.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What Lucia wants to do',
          ...I18n.optionLocalizations('commands.media_i.fun.lucia.text'),
          maxLength: 200,
          required: true,
          value: Parameters.string({maxLength: 200}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateLucia.CommandArgs) {
    return Formatter.Commands.MediaICreateLucia.createMessage(context, args);
  }
}
