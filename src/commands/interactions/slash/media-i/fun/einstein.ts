import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'einstein';

export class MediaIEinsteinCommand extends BaseInteractionCommandOption {
  description = 'Make Einstein write some text on a chalkboard';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.einstein.description');
  metadata = {
    id: Formatter.Commands.MediaICreateEinstein.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.einstein.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What Einstein writes',
          ...I18n.optionLocalizations('commands.media_i.fun.einstein.text'),
          maxLength: Formatter.Commands.MediaICreateEinstein.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateEinstein.MAX_TEXT_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateEinstein.CommandArgs) {
    return Formatter.Commands.MediaICreateEinstein.createMessage(context, args);
  }
}
