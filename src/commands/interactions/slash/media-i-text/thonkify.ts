import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'thonkify';

export class MediaIThonkifyCommand extends BaseInteractionCommandOption {
  description = 'Write text in the thinking emoji font';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.thonkify.description');
  metadata = {
    id: Formatter.Commands.MediaICreateThonkify.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.thonkify.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.thonkify.text'),
          maxLength: 70,
          required: true,
          value: Parameters.string({maxLength: 70}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateThonkify.CommandArgs) {
    return Formatter.Commands.MediaICreateThonkify.createMessage(context, args);
  }
}
