import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'sonic';

export class MediaISonicCommand extends BaseInteractionCommandOption {
  description = 'Make Sonic say some text';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.sonic.description');
  metadata = {
    id: Formatter.Commands.MediaICreateSonic.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.sonic.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What Sonic says',
          ...I18n.optionLocalizations('commands.media_i.fun.sonic.text'),
          maxLength: 200,
          required: true,
          value: Parameters.string({maxLength: 200}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateSonic.CommandArgs) {
    return Formatter.Commands.MediaICreateSonic.createMessage(context, args);
  }
}
