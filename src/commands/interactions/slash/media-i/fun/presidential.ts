import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'presidential';

export class MediaIPresidentialCommand extends BaseInteractionCommandOption {
  description = 'Create an iPhone Presidential Alert with some text';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.presidential.description');
  metadata = {
    id: Formatter.Commands.MediaICreatePresidential.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.presidential.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text of the alert',
          ...I18n.optionLocalizations('commands.media_i.fun.presidential.text'),
          maxLength: 250,
          required: true,
          value: Parameters.string({maxLength: 250}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreatePresidential.CommandArgs) {
    return Formatter.Commands.MediaICreatePresidential.createMessage(context, args);
  }
}
