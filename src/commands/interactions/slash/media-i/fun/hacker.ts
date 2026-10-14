import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hacker';

export class MediaIHackerCommand extends BaseInteractionCommandOption {
  description = 'Put text on a hacker\'s screen';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.hacker.description');
  metadata = {
    id: Formatter.Commands.MediaICreateHacker.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.hacker.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to put on the screen',
          ...I18n.optionLocalizations('commands.media_i.fun.hacker.text'),
          maxLength: 1000,
          required: true,
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'template',
          description: 'Which hacker (Default: Monitor)',
          ...I18n.optionLocalizations('commands.media_i.fun.hacker.template'),
          choices: [{name: 'Monitor', value: 0}, {name: 'Tablet', value: 1}],
          type: Number,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateHacker.CommandArgs) {
    return Formatter.Commands.MediaICreateHacker.createMessage(context, args);
  }
}
