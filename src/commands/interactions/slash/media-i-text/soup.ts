import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'soup';

export class MediaISoupCommand extends BaseInteractionCommandOption {
  description = 'Write text with alphabet soup letters';
  descriptionLocalizations = I18n.localizations('commands.media_i.fun.soup.description');
  metadata = {
    id: Formatter.Commands.MediaICreateSoup.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_i.fun.soup.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to write',
          ...I18n.optionLocalizations('commands.media_i.fun.soup.text'),
          maxLength: Formatter.Commands.MediaICreateSoup.MAX_TEXT_LENGTH,
          required: true,
          value: Parameters.string({maxLength: Formatter.Commands.MediaICreateSoup.MAX_TEXT_LENGTH}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaICreateSoup.CommandArgs) {
    return Formatter.Commands.MediaICreateSoup.createMessage(context, args);
  }
}
