import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'news';

export class MediaIVNewsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add a TV news lower third (BREAKING NEWS headline and ticker) to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.news.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayNews.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.news.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Headline',
          ...I18n.optionLocalizations('commands.media_iv_text.news.text'),
          maxLength: 150,
          required: true,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'ticker',
          description: 'Text for the ticker along the bottom',
          ...I18n.optionLocalizations('commands.media_iv_text.news.ticker'),
          maxLength: 200,
          value: Parameters.parsedMentionsText,
        },
        {
          name: 'label',
          description: 'Red tab above the headline (Default: BREAKING NEWS)',
          ...I18n.optionLocalizations('commands.media_iv_text.news.label'),
          maxLength: 30,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayNews.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayNews.createMessage(context, args);
  }
}
