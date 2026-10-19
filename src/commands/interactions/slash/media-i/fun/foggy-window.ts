import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'foggy-window';

export class MediaIFoggyWindowCommand extends BaseInteractionCommandOption {
  description = 'Write text on a foggy window';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.foggy_window.description');
  metadata = {
    id: Formatter.Commands.MediaICreateFoggyWindow.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.foggy_window.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.foggy_window.text'),
          maxLength: Formatter.Commands.MediaICreateFoggyWindow.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateFoggyWindow.MAX_TEXT_LENGTH}),
        },
        {
          name: 'background',
          description: 'Which window (Default: City at Sunset)',
          ...I18n.optionLocalizations('commands.media_i.fun.foggy_window.background'),
          type: ApplicationCommandOptionTypes.INTEGER,
          choices: [{name: 'Rainy Glass', value: 1}, {name: 'City at Sunset', value: 2}, {name: 'Pale City', value: 3}],
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateFoggyWindow.CommandArgs) {
    return Formatter.Commands.MediaICreateFoggyWindow.createMessage(context, args);
  }
}
